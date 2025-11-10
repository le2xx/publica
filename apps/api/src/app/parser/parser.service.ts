import { Injectable, OnApplicationShutdown, Logger } from '@nestjs/common';
import { Worker } from 'worker_threads';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ParserService implements OnApplicationShutdown {
  private readonly logger = new Logger(ParserService.name);
  private workers: Worker[] = [];

  constructor(private configService: ConfigService ) {
  }

  async parseBan(filePath?: string): Promise<number> {
    const workerPath = join(__dirname, './workers/ban-parser.worker.js');

    // 🔍 Логируем путь к воркеру
    this.logger.debug(`Starting worker from: ${workerPath}`);

    return new Promise((resolve, reject) => {
      const worker = new Worker(workerPath, {
        workerData: {
          filePath: filePath || './dist/apps/api/assets/adresses-02.csv.gz',
          dbConfig: {
            host: this.configService.get('DB_HOST'),
            port: this.configService.get('DB_PORT'),
            username: this.configService.get('DB_USER'),
            password: this.configService.get('DB_PASSWORD'),
            database: this.configService.get('DB_NAME'),
          }
        }
      });

      this.workers.push(worker);

      worker.on('message', (result) => {
        this.logger.debug(`Worker message: ${JSON.stringify(result)}`);
        if (result.status === 'success') {
          resolve(result.count);
        } else {
          reject(new Error(result.message || 'Unknown worker error'));
        }
      });

      worker.on('error', (error) => {
        // 🔥 КЛЮЧЕВОЕ УЛУЧШЕНИЕ: ловим ошибки запуска воркера
        this.logger.error(`Worker failed to start: ${error.message}`, error.stack);
        reject(error);
      });

      worker.on('exit', (code) => {
        this.workers = this.workers.filter((w) => w !== worker);
        if (code !== 0) {
          this.logger.error(`Worker exited with code ${code}`);
          reject(new Error(`Worker exited with code ${code}`));
        }
      });
    });
  }

  onApplicationShutdown() {
    this.logger.log(`Terminating ${this.workers.length} workers...`);
    this.workers.forEach((worker) => worker.terminate());
  }
}
