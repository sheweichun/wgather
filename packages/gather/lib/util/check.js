

const { PLUGIN_PATH, PACK_PATH, PLUGINS_PATH, GENERATOR_PATH } = require('./path');
const fs = require('fs');

const { NODE_MODULES } = require('./constant');
const path = require('path');
const pkg = require('../../package.json');
const Config = require('./config');
const semverDiff = require('semver-diff');
const chalk = require('chalk');
const Logger = require('./logger');
const urllib = require('urllib');


// const Loading = require('./loading');

const BASE_URL = 'http://registry.npm.alibaba-inc.com';
const URL = `${BASE_URL}/${pkg.name}`;


function checkPackageByTnpm(name) {
  return new Promise((resolve, reject) => {
    urllib.request(`${Config.get('pm').registry}/${name}`, { dataType: 'json', followRedirect: true }, (err, data) => {
      if (err || data.error) {
        return reject(err || `npm package【${name}】${data.error}`);
      }
      resolve(data);
    });
  });
}


// function getLastestVersion(){
//   (val, versions) => {
//       const reg = new RegExp(`${val.split('.')[1]}\\.\\d\\.\\d`);
//       const ret = Object.keys(versions).filter(vs => reg.test(vs)).sort();
//       return ret[ret.length - 1];
//     }
// }

const VERSION_MAP = {
  a: {
    index: 1,
    getLastest: (val, versions) => {
      const reg = new RegExp(`${val.split('.')[0]}\\.\\d\\.\\d`);
      const ret = Object.keys(versions).filter(vs => reg.test(vs)).sort();
      return ret[ret.length - 1];
    },
  },
  b: {
    index: 2,
    getLastest: (val, versions) => {
      const vss = val.split('.');
      const reg = new RegExp(`${vss[0]}\\.${vss[1]}\\.\\d`);
      const ret = Object.keys(versions).filter(vs => reg.test(vs)).sort();
      return ret[ret.length - 1];
    },
  },
  c: {
    index: 3,
    getLastest: val => val
      // const reg = new RegExp(`${val.split('.')[2]}\\.\\d\\.\\d`);
      // const ret = Object.keys(versions).filter(vs => reg.test(vs)).sort();
      // return ret[ret.length - 1];
    ,
  },
};
function getNomalizeVersion(version, checkType) {
  if (!version) {
    return '';
  }
  const versionItem = VERSION_MAP[checkType];
  if (!versionItem) {
    return '';
  }
  const versionIndex = versionItem.index;
  let verArr = version.split('.');
  if (verArr.length !== 3) {
    Logger.fatal('version must be a.b.c');
  }
  verArr = verArr.slice(0, versionIndex);
  const appendlength = 3 - versionIndex;
  for (let i = 0; i < appendlength; i += 1) {
    verArr.push('x');
  }
  return verArr.join('.');
}


function* askToUpdate(name, installDir, message) {
  const inquirer = require('inquirer');
  const Npm = require('./npm');
  const answer = yield inquirer.prompt([{
    type: 'confirm',
    default: true,
    name: 'updateFlag',
    message,
  }]);
  if (!answer.updateFlag) return;
  Logger.log(`start to update 【${name}】`);
  Npm.uninstall(name, {
    cwd: installDir,
  });
  Npm.install(name, {
    cwd: installDir,
  });
  Logger.success(`update【${name}】successfully`);
}

module.exports = {
  initPluginPackage() {
    const mkdirp = require('mkdirp');
    if (!fs.existsSync(PLUGIN_PATH)) {
      mkdirp.sync(PLUGIN_PATH);
    }
    if (!fs.existsSync(PACK_PATH)) {
      mkdirp.sync(PACK_PATH);
    }
    if (!fs.existsSync(PLUGINS_PATH)) {
      mkdirp.sync(PLUGIN_PATH);
    }
    if (!fs.existsSync(GENERATOR_PATH)) {
      mkdirp.sync(GENERATOR_PATH);
    }
    const pluginPkg = path.join(PLUGIN_PATH, 'package.json');
    if (!fs.existsSync(pluginPkg)) {
      fs.writeFileSync(pluginPkg, '{}');
    }
  },
  checkPermission() {
    const tmpFile = path.join(PLUGIN_PATH, 'luodan');
    fs.writeFileSync(path.join(PLUGIN_PATH, 'luodan'));
    const shelljs = require('shelljs');
    shelljs.rm(tmpFile);
  },
  checkVersion() {
    if (!Config.get('updateCheck')) return;
    const npm = Config.get('pm').name;
    return new Promise((resolve, reject) => {
      urllib.request(URL, { dataType: 'json', followRedirect: true }, (err, data) => {
        if (err || !data || data.error) {
          return reject(err || data.error);
        }
        let version = data['dist-tags'].latest;
        version = version.replace(/[\r\n]/, '');
        const diff = semverDiff(pkg.version, version);
        if (diff == null) return resolve();
        const opts = {};
        opts.message = opts.message || `Update 【${diff}】 ${chalk.dim(pkg.version)}${chalk.reset(' → ')
			}${chalk.green(version)} \nRun ${chalk.cyan(`${npm} i -g ${pkg.name}`)} to update`;

        opts.boxenOpts = opts.boxenOpts || {
          padding: 1,
          margin: 1,
          align: 'center',
          borderColor: 'yellow',
          borderStyle: 'double',
        };
        const boxen = require('boxen');
        Logger.warn(`\n${boxen(opts.message, opts.boxenOpts)}`);
        resolve();
      });
    });
  },
  * checkNpm(name, installDir) {
    const Npm = require('./npm');
    const npmDirName = path.resolve(installDir, NODE_MODULES, name);
    if (!fs.existsSync(npmDirName)) {
      Logger.warn(`【${name}】 hasn't installed...`);
      yield checkPackageByTnpm(name);
      Logger.log(`start to install 【${name}】...`);
      Npm.install(name, {
        cwd: installDir,
      });
      Logger.success(`【${name}】 installed successfully!`);
      return npmDirName;
    }
    if (!Config.get('updateCheck')) return npmDirName;
    const targetPkg = require(path.resolve(npmDirName, 'package.json'));
    const data = yield checkPackageByTnpm(name);
    let version = data['dist-tags'].latest;
    version = version.replace(/[\r\n]/, '');
    const diff = semverDiff(targetPkg.version, version);
    if (diff !== null) {
      yield askToUpdate(name, installDir,
        `Update 【${diff}】 ${chalk.dim(targetPkg.version)}${chalk.reset(' → ')}${chalk.green(version)}`);
    }
    return npmDirName;
  },
  * checkPack(name, v, versionCheck, installDirPath) {
    const Npm = require('./npm');
    const packVersionCheck = versionCheck || Config.get('packVersionCheck');
    const normalVersion = getNomalizeVersion(v, packVersionCheck);
    const result = { installDir: installDirPath };
    const mkdirp = require('mkdirp');
    // let dirName;
    // let installDir = PACK_PATH;
    if (!normalVersion) {
      result.dirName = path.resolve(installDirPath, NODE_MODULES, name);
    } else {
      const packDirName = path.resolve(installDirPath, name + normalVersion);
      result.installDir = packDirName;
      if (!fs.existsSync(packDirName)) {
        mkdirp.sync(packDirName);
      }
      result.dirName = path.resolve(packDirName, NODE_MODULES, name);
    }
    const { dirName, installDir } = result;
    if (!fs.existsSync(dirName)) {
      Logger.warn(`【${name}】 hasn't installed...`);
      yield checkPackageByTnpm(name);
      Logger.log(`start to install 【${name}】...`);
      Npm.install(name, {
        cwd: installDir,
      });
      Logger.success(`【${name}】 installed successfully!`);
      return result;
    }
    if (!Config.get('updateCheck')) return result;
    const targetPkg = require(path.resolve(dirName, 'package.json'));
    const data = yield checkPackageByTnpm(name);
    let version;
    let diff;
    const versionItem = VERSION_MAP[packVersionCheck];
    if (!versionItem || !v) {
      version = data['dist-tags'].latest;
      version = version.replace(/[\r\n]/, '');
      diff = semverDiff(targetPkg.version, version);
    } else {
      version = versionItem.getLastest(v, data.versions);
      if (!version || version <= v) {
        return result;
      }
      diff = semverDiff(targetPkg.version, version);
    }
    if (diff == null) return result;
    const inquirer = require('inquirer');
    const answer = yield inquirer.prompt([{
      type: 'confirm',
      default: true,
      name: 'updateFlag',
      message: `Update 【${diff}】 ${chalk.dim(targetPkg.version)}${chalk.reset(' → ')}${chalk.green(version)}`,
    }]);
    if (!answer.updateFlag) return result;
    Logger.log(`start to update 【${name}】`);
    Npm.uninstall(name, {
      cwd: installDir,
    });
    const installName = name + (normalVersion ? `@${normalVersion}` : '');
    Npm.install(installName, {
      cwd: installDir,
    });
    Logger.success(`update【${installName}】successfully`);
    return result;
  },
};

