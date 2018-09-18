#!/usr/bin/env node


process.env.NODE_ENV = 'development';

// const path = require('path');
const program = require('commander');
const co = require('co');
const logger = require('../lib/util/logger');
const loadConfig = require('../lib/util/load-config');
const Gather = require('../lib/gather');

// const configs = [];
program
  .option('-c --config <configfile>', 'config file', val => val.split(','))
  .option('-t --port <port>', 'server port')
  .option('-d --develop', 'development Mode')
  .option('-v --visual', 'Visualize build stat')
  .option('-e --entries <pages>', 'Develop Entries', val => val.split(','))
  // .option('-p --progress', 'Display progress')
  .option('--no-color', 'Disable colors to display the statistics')
  .parse(process.argv);

program.config = program.config || ['gather.conf.js'];
co(function* () {
  for (let i = 0; i < program.config.length; i += 1) {
    const config = loadConfig(program.config[i]);
    const packer = new Gather(config, {
      port: program.port,
      visual: program.visual,
      entries: program.entries,
      develop: program.develop,
    });
    // let pathName;
    try {
      yield packer.loadPacker();
      yield packer.loadPlugin();
      yield packer.dev();
    } catch (_) {
      // console.log(_);
      logger.fatal(_);
    }
  }
});

