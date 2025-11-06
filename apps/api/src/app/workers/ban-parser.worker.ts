import { parentPort } from 'worker_threads';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as zlib from 'zlib';
import csv = require('csv-parser');
import { pipeline } from 'stream/promises';

const parseCsvGz = async (filePath: string): Promise<Record<string, string>[]> => {
  const results: Record<string, string>[] = [];

  // Создаём поток чтения файла
  const readStream = fs.createReadStream(filePath);

  // Создаём поток распаковки gzip
  const gunzip = zlib.createGunzip();

  // Создаём поток парсинга CSV
  const parser = csv({ separator: ';' });

  // Собираем результаты
  parser.on('data', (data: Record<string, string>) => {
    results.push(data);
  });

  // Запускаем pipeline: файл → gunzip → csv-parser
  await pipeline(readStream, gunzip, parser);

  return results;
}

(async () => {
  try {
    // parentPort?.postMessage({ status: 'parse' });
    const records = await parseCsvGz('./dist/apps/api/assets/adresses-02.csv.gz');

    parentPort?.postMessage({
      status: 'success',
      count: records?.length,
    });
    Logger.log(`✅ Успешно обработано ${records?.length} записей`);
    console.log(records[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    Logger.error(`❌ Ошибка в воркере: ${message}`);
    parentPort?.postMessage({
      status: 'error',
      message,
    });
  }
})();
