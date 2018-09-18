#!/usr/bin/env node


const program = require('commander');


const UtilPath = require('../lib/util/path');
const Config = require('../lib/util/config');
const Check = require('../lib/util/check');

const logger = require('../lib/util/logger');
const path = require('path');
const Module = require('module');
const chalk = require('chalk');
const co = require('co');


// https://gist.github.com/branneman/8048520#6-the-hack
process.env.NODE_PATH = [
  path.resolve(__dirname, '../'),
  process.env.NODE_PATH || '',
].join(path.delimiter);
Module.Module._initPaths();


co(function* () {
  try {
    Check.initPluginPackage();
    Config.init();
    Check.checkPermission();
  } catch (_) {
    logger.fatal(`${chalk.yellow('permission denied')}
    Try get access by
    ${chalk.cyan(`sudo chown -R $USER:$(id -gn $USER) ${UtilPath.PLUGIN_PATH}`)}
  `);
  }
  try {
    yield Check.checkVersion();
  } catch (_) {
    logger.fatal(_);
  }


  program
  .usage('<command> [options]')
  .version(require('../package.json').version)
  .command('dev', 'Development mode')
  .command('build', 'Production mode')
  .command('config', 'Update Gather Config')
  .command('init', 'Generator mode')
  .parse(process.argv);


  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
});

