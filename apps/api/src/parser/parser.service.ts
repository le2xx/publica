import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Worker } from 'worker_threads';
import { join } from 'path';

@Injectable()
export class ParserService implements OnApplicationShutdown {
  private workers: Worker[] = [];

  async parseBan(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(join(__dirname, './worker.js'), {
        // TODO переименовать воркеры
        workerData: { filePath },
      });

      this.workers.push(worker);

      worker.on('message', (result: any) => {
        if (result.status === 'success') {
          resolve(result.count);
        } else {
          reject(new Error(result.message));
        }
      });

      worker.on('error', reject);
      worker.on('exit', (code) => {
        this.workers = this.workers.filter((w) => w !== worker);
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  onApplicationShutdown() {
    // Завершаем все воркеры при остановке приложения
    this.workers.forEach((worker) => worker.terminate());
  }
}
