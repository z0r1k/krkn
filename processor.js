require('./helpers/catch');
require('./helpers/config');

const getCollection = require('./helpers/collection');
const Decimal = require('decimal.js');

function mapFn() {
  // could be configuration but since it will be executed in document context by mongo itself i cannot bind dynamic value here
  if (this.confirmations >= 6) {
    emit(this.address, {
      address: this.address,
      count: 1,
      sum: this.amount
    });
  }
}

function reduceFn(key, values) {
  let deposit = {
    address: key,
    count: 0,
    sum: 0
  };

  for (let value of values) {
    deposit.count += value.count;
    // should handle send/receive okeyish since send would have -amount
    // should handle 1.2e-7 and such okeyish
    deposit.sum += value.sum;
  }

  // should deposit be always positive? or if it is negative it is kind of overdraft?
  // transaction is valid when enough peers confirmed it
  // but what if it contains amount higher than current deposit and there is not enough funds? should i validate for this too?
  return deposit;
}

const run = async () => {
  // i could have put this into db as well and there is no reason to not to do it, but...
  const customers = {
    'mvd6qFeVkqH6MNAS2Y2cLifbdaX5XUkbZJ': 'Wesley Crusher',
    'mmFFG4jqAtw9MoCC88hw5FNfreQWuEHADp': 'Leonard McCoy',
    'mzzg8fvHXydKs8j9D2a8t7KpSXpGgAnk4n': 'Jonathan Archer',
   '2N1SP7r92ZZJvYKG2oNtzPwYnzw62up7mTo': 'Jadzia Dax',
    'mutrAf4usv3HKNdpLwVD4ow2oLArL6Rez8': 'Montgomery Scott',
    'miTHhiX3iFhVnAEecLjybxvV5g8mKYTtnM': 'James T. Kirk',
    'mvcyJMiAcSXKAEsQxbW9TYZ369rsMG6rVV': 'Spock'
  };

  const col = await getCollection();

  try {
    const deposits = await col.mapReduce(mapFn, reduceFn, { out: { inline: 1 } } );

    // print(customers, deposits);
    // making sure things are printed out the same way as in README.md
    // because i dont know will regex handle different order of customers but the same 1-10 line pattern
    printStrict(customers, deposits.slice());
  } catch (e) { throw e; }
};

const print = (customers = {}, deposits = []) => {
  let min = undefined;
  let max = undefined;
  let count = 0;
  let sum = 0;

  for (const deposit of deposits) {
    const customer = customers[deposit.value.address];
    if (customer) {
      console.log(`Deposited for ${customer}: count=${deposit.value.count} sum=${new Decimal(deposit.value.sum).toFixed(8)}`);
    } else {
      count++;
      sum += deposit.value.sum;
    }

    if (!min || deposit.value.sum <= min) {
      min = deposit.value.sum;
    } else if (!max || deposit.value.sum >= max) {
      max = deposit.value.sum;
    }
  }

  console.log(`Deposited without reference: count=${count} sum=${new Decimal(sum).toFixed(8)}`);
  console.log(`Smallest valid deposit: ${new Decimal(min).toFixed(8)}`);
  console.log(`Largest valid deposit: ${new Decimal(max).toFixed(8)}`);
};

const printStrict = (customers = {}, deposits = []) => {
  let out = [];
  let min = undefined;
  let max = undefined;
  let count = 0;
  let sum = 0;

  Object.keys(customers).forEach(id => {
    const idx = deposits.findIndex(el => {
      if (!el) {
        return false;
      }
      return el.value.address === id;
    });
    if (idx === -1) { return; }

    const deposit = deposits[idx];
    if (!min || deposit.value.sum <= min) {
      min = deposit.value.sum;
    } else if (!max || deposit.value.sum >= max) {
      max = deposit.value.sum;
    }

    out.push(`Deposited for ${customers[id]}: count=${deposit.value.count} sum=${new Decimal(deposit.value.sum).toFixed(8)}`);
    delete deposits[idx];
  });

  for (let deposit of deposits) {
    if (deposit) {
      count++;
      sum += deposit.value.sum;

      if (!min || deposit.value.sum <= min) {
        min = deposit.value.sum;
      } else if (!max || deposit.value.sum >= max) {
        max = deposit.value.sum;
      }
    }
  }
  out.push(`Deposited without reference: count=${count} sum=${new Decimal(sum).toFixed(8)}`);
  out.push(`Smallest valid deposit: ${new Decimal(min).toFixed(8)}`);
  out.push(`Largest valid deposit: ${new Decimal(max).toFixed(8)}`);

  out.forEach(v => console.log(v));
};

process.on('message', async message => {
  if (message.status !== 'ready') { process.exit(1); }

  await run();
  process.exit(0);
});
