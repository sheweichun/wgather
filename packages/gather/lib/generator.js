const Loader = require('./util/loader');
const { GENERATOR_PATH } = require('./util/path');
const path = require('path');
const getClient = require('./util/gitlab');
const Git = require('./util/git');
const Downloader = require('./util/download');
const shelljs = require('shelljs');
const { npmInstall } = require('./util/npm');
// const Logger = require('./util/logger');

module.exports = class Generator {
  constructor(name, option = {}) {
    const { scope = '@ali' } = option;
    this.name = `${scope}/gather-generator-${name}`;
    this.option = option;
    this.inquirer = require('inquirer');
    this.downloader = Downloader;
    this.npmInstall = npmInstall;
    this.gitClient = Git;
  }
  changePwd(dir) {
    if (!this.originPwd) {
      this.originPwd = shelljs.pwd();
    }
    shelljs.cd(dir);
  }
  restorePwd() {
    if (this.originPwd) {
      this.originPwd = null;
      shelljs.cd(this.originPwd);
    }
  }
  * prompt(questions) {
    return yield this.inquirer.prompt(questions);
  }
  * loadPackage() {
    const genFn = yield Loader.loadNpm(this.name, GENERATOR_PATH,
      this.option.develop ? path.resolve(__dirname, '../../gather-generator-crf/lib/index.js') : null);
    this.handler = genFn(this);
  }

  * getConfig() {
    return yield this.handler.getConfig(getClient);
  }
  * generate(config) {
    return yield this.handler.generate(getClient, config);
  }
}
;
