const { Worker } = require('worker_threads');
const path = require('path');

const worker = new Worker(path.resolve(__dirname, 'dist/apps/api/workers/ban-parser.worker.js'));

worker.on('message', (msg) => {
  console.log('✅ MESSAGE:', msg);
});

worker.on('error', (err) => {
  console.error('❌ WORKER ERROR:', err);
});

worker.on('exit', (code) => {
  console.log(`🔚 Worker exited with code ${code}`);
});
