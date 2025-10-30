import { parentPort } from 'worker_threads';
import { Logger } from '@nestjs/common';

(async () => {
  try {
    parentPort?.postMessage({ status: 'success', count: 10 });
    Logger.log('!!!!!');
  } catch (error) {
    parentPort?.postMessage({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
})();
