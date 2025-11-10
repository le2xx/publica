import { parentPort } from 'worker_threads';
import * as fs from 'fs';
import * as zlib from 'zlib';
import csv = require('csv-parser');
import { pipeline } from 'stream/promises';
import { AddressEntity } from '../address/address.entity';
import { workerData } from 'node:worker_threads';
import { DataSource } from 'typeorm';

interface WorkerData {
  filePath: string;
  dbConfig: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
}

interface SyncStats {
  total: number;
  inserted: number;
  updated: number;
  unchanged: number;
  errors: number;
}

// Преобразует CSV-запись в сущность
const toAddressEntity = (record: Record<string, string>): AddressEntity => {
  const entity = new AddressEntity();
  entity.id = record.id;
  entity.id_fantoir = record.id_fantoir || null;
  entity.numero = record.numero || null;
  entity.rep = record.rep || null;
  entity.nom_voie = record.nom_voie || null;
  entity.code_postal = record.code_postal || null;
  entity.code_insee = record.code_insee || null;
  entity.nom_commune = record.nom_commune || null;
  entity.code_insee_ancienne_commune = record.code_insee_ancienne_commune || null;
  entity.nom_ancienne_commune = record.nom_ancienne_commune || null;
  entity.x = record.x || null;
  entity.y = record.y || null;
  entity.lon = record.lon ? parseFloat(record.lon) : null;
  entity.lat = record.lat ? parseFloat(record.lat) : null;
  entity.type_position = record.type_position || null;
  entity.alias = record.alias || null;
  entity.nom_ld = record.nom_ld || null;
  entity.libelle_acheminement = record.libelle_acheminement || null;
  entity.nom_afnor = record.nom_afnor || null;
  entity.source_position = record.source_position || null;
  entity.source_nom_voie = record.source_nom_voie || null;
  entity.certification_commune = record.certification_commune || null;
  entity.cad_parcelles = record.cad_parcelles || null;
  return entity;
}

// Сравнивает две сущности (игнорируя id)
const hasChanges = (existing: AddressEntity, incoming: AddressEntity): boolean => {
  const fields = (Object.keys(incoming) as (keyof AddressEntity)[])
    .filter(key => key !== 'id');
  return fields.some(field => existing[field] !== incoming[field]);
}

const parseCsvGz = async (filePath: string): Promise<Record<string, string>[]> => {
  const results: Record<string, string>[] = [];
  const readStream = fs.createReadStream(filePath);
  const gunzip = zlib.createGunzip();
  const parser = csv({ separator: ';' });
  parser.on('data', (data) => results.push(data));
  await pipeline(readStream, gunzip, parser);
  return results;
}


(async () => {
  const { filePath, dbConfig } = workerData as WorkerData;
  const stats: SyncStats = {
    total: 0,
    inserted: 0,
    updated: 0,
    unchanged: 0,
    errors: 0,
  };

  try {
    parentPort?.postMessage({ status: 'start', message: 'Начинаю парсинг...' });
    const records = await parseCsvGz(filePath);

    // 🔁 Дедупликация: оставляем ПОСЛЕДНЮЮ запись для каждого id
    const deduped = new Map<string, Record<string, string>>();
    for (const record of records) {
      deduped.set(record.id, record);
    }
    const finalRecords = Array.from(deduped.values());
    console.log(`🗑️ Удалено дубликатов: ${records.length - finalRecords.length}`);

    stats.total = finalRecords.length;
    parentPort?.postMessage({ status: 'parsed', count: finalRecords.length });

    const dataSource = new DataSource({
      type: 'postgres',
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      entities: [AddressEntity],
      logging: false,
    });

    await dataSource.initialize();
    const repo = dataSource.getRepository(AddressEntity);

    parentPort?.postMessage({ status: 'db_connected' });

    for (let i = 0; i < finalRecords.length; i++) {
      const record = finalRecords[i];
      try {
        const incoming = toAddressEntity(record);
        const existing = await repo.findOneBy({ id: incoming.id });

        if (!existing) {
          await repo.save(incoming);
          stats.inserted++;
        } else {
          if (hasChanges(existing, incoming)) {
            // Копируем id, чтобы не сломать PK
            incoming.id = existing.id;
            await repo.save(incoming);
            stats.updated++;
          } else {
            stats.unchanged++;
          }
        }

        // Логируем прогресс каждые 1000 записей
        if ((i + 1) % 1000 === 0) {
          parentPort?.postMessage({ status: 'progress', stats });
        }
      } catch (err: any) {
        stats.errors++;

        // Логируем проблемную запись
        const errorRecord = finalRecords[i];
        console.error('🚨 Проблемная запись:', {
          index: i,
          id: errorRecord.id,
          fields: Object.fromEntries(
            Object.entries(errorRecord).filter(([key, value]) => {
              const strValue = String(value || '');
              return strValue.length > 200; // показываем только длинные поля
            })
          ),
          allFieldsLength: Object.entries(errorRecord).reduce((acc, [key, value]) => {
            acc[key] = String(value || '').length;
            return acc;
          }, {} as Record<string, number>)
        });


        parentPort?.postMessage({
          status: 'error_record',
          index: i,
          id: record.id,
          message: err.message,
        });
      }
    }

    await dataSource.destroy();
    parentPort?.postMessage({ status: 'success', stats });

  } catch (error: any) {
    parentPort?.postMessage({ status: 'error', message: error.message });
  }
})();
