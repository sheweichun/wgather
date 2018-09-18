

const path = require('path');
const Config = require('../../util/config');
const Constant = require('../../util/constant');
const Setting = require('../../util/setting');
const fs = require('fs');
const { Logger } = require('@ali/gather-core');


const webpack = require('webpack');

const merge = Object.assign;
const GATHER_WORK_PATH = Config.get('gatherwork');
const DEST_PATH = path.resolve(Constant.CWD, Config.get('dest'));
const BUILD_LIB = Config.get('dllLib');
const DEV_PATH = path.resolve(Constant.CWD, GATHER_WORK_PATH);
const BUILD_VERDOR = Config.get('dllVendor');
const SETTING_KEY = 'dllbuild';
const SETTING_DEV_KEY = 'dlldev';
const MANIFEST_BUILD = path.resolve(Constant.CWD, `${GATHER_WORK_PATH}/dll/manifest_prod.json`);
const MANIFEST_DEV = path.resolve(Constant.CWD, `${GATHER_WORK_PATH}/dll/manifest_dev.json`);
const Util = {
  generateReferenConfig(manifest) {
    return {
      context: Constant.CWD,
      manifest: manifest || MANIFEST_BUILD,
    };
  },
  generateDevConfig(vendors) {
    return {
      output: {
        path: DEV_PATH,
        filename: '[name].js',
        library: '[name]',
      },
      entry: {
        [BUILD_LIB]: vendors,
      },
      plugins: [
        new webpack.DllPlugin({
          path: MANIFEST_DEV,
          name: '[name]',
          context: Constant.CWD,
        }),
      ],
    };
  },
  generateBuildConfig(vendors) {
    return {
      output: {
        path: DEST_PATH,
        filename: '[name].js',
        library: '[name]',
      },
      entry: {
        [BUILD_VERDOR]: vendors,
      },
      plugins: [
        new webpack.DllPlugin({
          path: MANIFEST_BUILD,
          name: '[name]',
          context: Constant.CWD,
        }),
        new webpack.optimize.UglifyJsPlugin(Config.get('uglyOpt')),
      ],
    };
  },
  equalObj(src, dest) {
    return JSON.stringify(src) === JSON.stringify(dest);
  },
  generateBuildDll(config) {
    return new Promise((resolve) => {
      const compiler = webpack(config);
      compiler.run((err, stats) => {
        if (err) {
          Logger.fatal(err);
        }
        const statConfig = {
          chunks: false,
          hash: false,
          version: false,
        };
        if (stats.hasErrors()) {
          Logger.fatal(stats.toString(statConfig));
        }
        // Logger.success(`info\n${stats.toString(config)}`);
        resolve();
      });
    });
  },
  checkVendor() {
    return fs.existsSync(path.relative(Constant.CWD, Config.get('dest'), `${BUILD_VERDOR}.js`));
  },
  getBuildVendors() {
    const pkg = require(path.resolve(Constant.CWD, 'package.json'));
    return pkg.dependencies;
  },
  getDevVendors(rev) {
    const pkg = require(path.resolve(Constant.CWD, 'package.json'));
    return merge({}, pkg.dependencies, typeof rev === 'object' ? rev : {});
  },
};

class HackDllReferencePlugin {
  constructor(options) {
    this.options = options;
  }
  apply(compiler) {
    compiler.plugin('before-compile', (params, callback) => {
      const manifest = this.options.manifest;
      params.compilationDependencies = params.compilationDependencies.filter(val => val !== manifest);
      callback();
    });
  }
}

// gather.packOption.dll
module.exports = (gather, webpackConfig) => ({
  * dev() {
    const curDlls = Setting.get(SETTING_DEV_KEY);
    const dlls = Util.getDevVendors(gather.packOption.dll);
    const attrList = Object.keys(dlls);
    if (!Util.equalObj(curDlls, dlls) || !fs.existsSync(MANIFEST_DEV)
      || !fs.existsSync(path.resolve(DEV_PATH, `${BUILD_LIB}.js`))) {
      yield Util.generateBuildDll(Util.generateDevConfig(attrList));
      Setting.set(SETTING_DEV_KEY, dlls);
    }
    if (attrList.length === 0) return;
    // yield Util.generateBuildDll(Util.generateDevConfig(attrList));
    // Setting.set(SETTING_DEV_KEY, dlls);
    const ddlConfig = Util.generateReferenConfig(MANIFEST_DEV);
    webpackConfig.plugins.push(new webpack.DllReferencePlugin(ddlConfig),
  new HackDllReferencePlugin(ddlConfig));
  },
  * build() {
    const curDlls = Setting.get(SETTING_KEY);
    const dlls = Util.getBuildVendors();
    const attrList = Object.keys(dlls);
    if (!Util.equalObj(curDlls, dlls) || !fs.existsSync(MANIFEST_BUILD)
      || !fs.existsSync(path.resolve(DEST_PATH, `${BUILD_VERDOR}.js`))) {
      yield Util.generateBuildDll(Util.generateBuildConfig(attrList));
      Setting.set(SETTING_KEY, dlls);
    }
    if (attrList.length === 0) return;
    webpackConfig.plugins.push(new webpack.DllReferencePlugin(Util.generateReferenConfig()));
  },
});
