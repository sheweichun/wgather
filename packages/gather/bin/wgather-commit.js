#!/usr/bin/env node


// const path = require('path');
const program = require('commander');
const co = require('co');
// const Logger = require('../lib/util/logger');


program
  .option('-d --develop', 'development Mode')
  .option('-m --comment', 'commit comment')
  .option('-p --push', 'push to remote repository')
//   .arguments('<generator>')
//   .action((gen) => {
//     generatorName = gen;
//   })
  .parse(process.argv);
// console.log('generator :', generatorName);
// console.log('program.develop :', program.develop);


// if (!generatorName) {
//   Logger.fatal('no generatorName given!');
// }

co(function* () {
//   const generator = new Generator(generatorName, {
//     develop: program.develop,
//     scope: program.scope,
//     project: program.project,
//   });
//   try {
//     yield generator.loadPackage();
//     const config = yield generator.getConfig();
//     yield generator.generate(config);
//   } catch (_) {
//     Logger.fatal(_);
//   }
});

