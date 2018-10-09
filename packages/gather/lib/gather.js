const Module = require('module');
const Logger = require('./util/logger');
const Check = require('./util/check');
// const Config = require('./util/config');

const path = require('path');
const fs = require('fs');
const Npm = require('./util/npm');
const { PACK_PATH, PLUGINS_PATH } = require('./util/path');

const NODE_MODULES = 'node_modules';
// const PathUtil = require('./util/path');
// const { CWD_PATH } = require('./util/path');
let originRequire;
module.exports = class Gather {
  constructor(cfg = {}, option) {
    const { packName, packVersion, packVersionCheck, packScope, plugins, packOption } = cfg;
    if (!packName) {
      Logger.fatal('Packer\'s name must be needed!');
    }
    // this.pluginDir = PathUtil.PLUGIN_PATH;
    this.moduleDirList = [];
    this.plugins = plugins || [];
    this.pluginList = [];
    this.packName = packName;
    this.packScope = packScope ? `${packScope}/` : '';
    this.packVersion = packVersion;
    this.packVersionCheck = packVersionCheck;
    this.packOption = packOption || {};
    // this.webpackConfig = webpackConfig || {};
    this.option = option || {};
    // this.packer = this.loadPacker(name, config);
  }
  installPackage(dir, name, option) {
    return Npm.tarInstall(dir, name, option);
  }
  loadPackage(name) {
    return require(path.resolve(process.cwd(), 'node_modules', name));
  }
  hookRequire(fn) {
    if (originRequire) return;
    originRequire = Module.prototype.require;
    Module.prototype.require = function (p) {
      let ret;
      try {
        ret = originRequire.call(this, p);
      } catch (e) {
        fn(p);
        ret = originRequire.call(this, p);
      }
      return ret;
    };
  }
  restoreRequire() {
    Module.prototype.require = originRequire;
    originRequire = null;
  }
  * loadPacker() {
    // Logger.log('loading packer...');
    // 此处hack是为了解决fs模块 realpathCache的问题
    const realpathSync = fs.realpathSync;
    fs.realpathSync = p => realpathSync.call(fs, p);

    const now = Date.now();
    const fName = `${this.packScope}wgather-pack-${this.packName}`;
    Logger.log(`【${fName}】is loading ...`);

    let gatherPackWebpack;
    if (!this.option.develop) {
      const result = yield Check.checkPack(fName,
        this.packVersion, this.packVersionCheck, PACK_PATH);
      this.moduleDirList.push(path.resolve(result.installDir, NODE_MODULES));
      gatherPackWebpack = require(result.dirName);
    } else {
      gatherPackWebpack = require(`../../gather-pack-${this.packName}/lib/index`);
      this.moduleDirList.push(path.resolve('../../gather-pack-webpack', NODE_MODULES));
    }

    Logger.success(`【${this.packName}】loaded succesfully,use【${Date.now() - now}】ms`);
    this.packer = gatherPackWebpack(this);
    fs.realpathSync = realpathSync;
    // Logger.success('packer loaded successfully!');
  }
  * loadPlugin() {
    // Logger.log('loading plugins...');
    // 此处hack是为了解决fs模块 realpathCache的问题
    const realpathSync = fs.realpathSync;
    fs.realpathSync = p => realpathSync.call(fs, p);
    for (let i = 0; i < this.plugins.length; i += 1) {
      const pl = this.plugins[i];
      const result = yield Check.checkPack(`${this.packScope}gather-plugin-${pl.name}`, pl.version, pl.versionCheck, PLUGINS_PATH);
      this.moduleDirList.push(path.resolve(result.installDir, NODE_MODULES));
      this.pluginList.push(require(result.dirName)(this));
    }
    fs.realpathSync = realpathSync;
    // Logger.success('plugins loaded successfully!');
  }
  * dev() {
    yield this.packer.checkPackage();
    const config = yield this.packer.getDevConfig();
    if (this.pluginList) {
      for (let i = 0; i < this.pluginList.length; i += 1) {
        const target = this.pluginList[i](this, config);
        if (target.beforeDev) {
          yield target.beforeDev(config);
        }
      }
    }
    this.packer.dev(config);
    if (this.pluginList) {
      for (let i = 0; i < this.pluginList.length; i += 1) {
        const target = this.pluginList[i](this, config);
        if (target.afterDev) {
          yield target.afterDev(config);
        }
      }
    }
  }
  * build() {
    yield this.packer.checkPackage();
    const config = yield this.packer.getBuildConfig();
    if (this.pluginList) {
      for (let i = 0; i < this.pluginList.length; i += 1) {
        const target = this.pluginList[i](this, config);
        if (target.beforeBuild) {
          yield target.beforeBuild(config);
        }
      }
    }
    this.packer.build(config);
    if (this.pluginList) {
      for (let i = 0; i < this.pluginList.length; i += 1) {
        const target = this.pluginList[i](this, config);
        if (target.afterBuild) {
          yield target.afterBuild(config);
        }
      }
    }
  }
};
