
const program = require('commander');
// const co = require('co');
const Config = require('../lib/util/config');
const Logger = require('../lib/util/logger');
const chalk = require('chalk');

let operation;
let key;
let value;
program
  .arguments('<operation> [key] [value]')
  .action((opr, k, v) => {
    operation = opr;
    key = k;
    value = v;
  })
  .parse(process.argv);

if (!operation) {
  Logger.fatal('no operation given,operation must be get or set!');
}
if (operation !== 'get' && operation !== 'set') {
  Logger.fatal('operation must be get or set!');
}


if (operation === 'get') {
  if (!key) {
    Logger.log(Config.get());
  } else {
    const result = Config.get(key);
    if (result === undefined) {
      Logger.fatal(`no 【${chalk.red(key)}】 property in Configuration`);
    }
    Logger.log(Config.get(key));
  }
} else if (operation === 'set') {
  if (!key) {
    Config.update();
    Logger.log('merge default Configuration with current Configuration');
  } else if (!value) {
    Logger.fatal('no value given!');
  } else {
    const ret = Config.update(key, value);
    if (!ret) {
      Logger.warn(`【${chalk.red(key)}】 is not a valid key`);
    }
  }
  Logger.log(`Current Configuration :${JSON.stringify(Config.get(), null, 2)}`);
}

