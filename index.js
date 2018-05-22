require('./helpers/catch');
const cluster = require('cluster');

const workerSetup = { exec: 'worker.js' };
const inputFiles = ['./data/transactions-1.json', './data/transactions-2.json'];

if (cluster.isMaster) {
  for (let file of inputFiles) {
    cluster.setupMaster(Object.assign({args: [file]}, workerSetup));
    cluster.fork();
  }

  cluster.setupMaster({args: [], exec: 'processor.js' });
  const processor = cluster.fork();

  let confirmations = 0;
  cluster.on('message', (worker, message) => {
    if (message.status === 'done') { confirmations++ }
    if (confirmations >= inputFiles.length) {
      processor.send({ status: 'ready' });
    }
  });

  cluster.on('exit', (worker, code) => {
    // console.info(`Process ${worker.process.spawnargs.join(' ')} is exited with code ${code}`);
  });
}
