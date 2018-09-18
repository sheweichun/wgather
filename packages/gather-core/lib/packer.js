
const fs = require('fs');
const path = require('path');
const Logger = require('./util/logger');

module.exports = class Packer {
  constructor(gather) {
    this.gather = gather;
  }
  * checkPackage() {
    if (!this.checkList) return;
    const cwd = process.cwd();
    const installList = [];
    for (let i = 0; i < this.checkList.length; i += 1) {
      const willCheck = this.checkList[i];
      if (!fs.existsSync(path.resolve(cwd, 'node_modules', willCheck.name))) {
        installList.push(willCheck);
      }
    }
    if (installList.length > 0) {
      const installNames = installList.map(item => item.name + (item.version ? `@${item.version}` : '')).join(' ');
      Logger.warn(`gather will install 【${installNames}】`);
      this.gather.installPackage(cwd, installNames, { dev: true });
      Logger.success('install successfully!');
    }
  }
  getBuildConfig() {
    Logger.warn('developer need rewrite Packer\'s getBuildConfig method');
  }
  getDevConfig() {
    Logger.warn('developer need rewrite Packer\'s getDevConfig method');
  }
  build() {
    Logger.warn('developer need rewrite Packer\'s build method');
  }
  dev() {
    Logger.warn('developer need rewrite Packer\'s dev method');
  }
};
