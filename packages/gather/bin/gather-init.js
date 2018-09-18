#!/usr/bin/env node


// const path = require('path');
const program = require('commander');
const co = require('co');
const Logger = require('../lib/util/logger');
const Generator = require('../lib/generator');

let generatorName;
program
  .option('-d --develop', 'development Mode')
  // .option('-c --config <configfile>', 'config file')
  .option('-s --scope', 'npm scope')
  .option('-p --project <projectId>', 'init project template')
  .arguments('<generator>')
  .action((gen) => {
    generatorName = gen;
  })
  .parse(process.argv);
// console.log('generator :', generatorName);
// console.log('program.develop :', program.develop);

// program.config = program.config || 'gather.conf.js';
if (!generatorName) {
  Logger.fatal('no generatorName given!');
}

co(function* () {
  const generator = new Generator(generatorName, {
    develop: program.develop,
    scope: program.scope,
    project: program.project,
    // config: program.config,
  });
  try {
    yield generator.loadPackage();
    const config = yield generator.getConfig();
    yield generator.generate(config);
  } catch (_) {
    Logger.fatal(_);
  }
});

