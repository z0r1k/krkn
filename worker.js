require('./helpers/catch');
require('./helpers/config');

const dataFile = process.argv.slice(2).length ? process.argv.slice(2)[0] : undefined;
if (!dataFile) {
  throw new Error('No data file is provided');
}

const data = require(dataFile).transactions;
const filtered = data.filter(transaction => transaction.confirmations >= 6);

// console.debug(`${dataFile} contains ${data.length} transactions. ${filtered.length} of which are valid.`);

// i could have used async/await here but sometimes i like good old then/catch
// and sometimes it is more async than async/await
require('./helpers/collection')()

  .then(col => {
    // first i wanted to use "upsert" but it wont solve all data update "problems"
    // cause it will push new data, but I would still need to detect data to be removed
    // so I decided to skip it completely
    return col.find().toArray().then(storedData => {
      return storedData.length ? Promise.resolve() :
        col.insert(data).then(() => col.createIndex({ "txid": 1 }));
    })
  })

  .then(() => {
    process.send({ file: dataFile, status: 'done' });
    process.exit(0);
  })

  .catch((err, client) => {
    if (client) { client.close(); }
    throw new Error(err);
  });
