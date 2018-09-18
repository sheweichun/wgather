const fs = require('fs');
const Logger = require('./logger');
// const path = require('path');
const Check = require('./check');
// const Config = require('./config');


module.exports = {
  * loadNpm(name, installDir, packagePath) {
    const realpathSync = fs.realpathSync;
    fs.realpathSync = p => realpathSync.call(fs, p);
    const now = Date.now();
    Logger.log(`【${name}】is loading ...`);
    let npmPackage;
    if (!packagePath) {
      const loadPath = yield Check.checkNpm(name, installDir);
      npmPackage = require(loadPath);
    } else {
      npmPackage = require(packagePath);
    }
    Logger.success(`【${name}】loaded succesfully,use【${Date.now() - now}】ms`);
    fs.realpathSync = realpathSync;
    return npmPackage;
  },
}
;
