

const path = require('path');
const Config = require('../../util/config');
const Constant = require('../../util/constant');
const Setting = require('../../util/setting');
const fs = require('fs');
const { Logger, TypeCheck } = require('wgather-core');

const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const webpack = require('webpack');

const { isArray, isObject } = TypeCheck;
// function isBoolean(val) {
//   return typeof (val) === 'boolean';
// }
// function isArray(val) {
//   return Object.prototype.toString.call(val) === '[object Array]';
// }
// function isObject(val) {
//   return Object.prototype.toString.call(val) === '[object Object]';
// }

// gather.packOption.dll
module.exports = (gather, webpackConfig) => {
  // const merge = Object.assign;
  const GATHER_WORK_PATH = Config.get('gatherwork');
  const DEST_PATH = path.resolve(Constant.CWD, Config.get('dest'));
  const BUILD_LIB = Config.get('dllLib');
  const DEV_PATH = path.resolve(Constant.CWD, GATHER_WORK_PATH);
  const BUILD_VERDOR = Config.get('dllVendor');
  const SETTING_KEY = 'dllbuild';
  const SETTING_DEV_KEY = 'dlldev';
  const MANIFEST_BUILD = path.resolve(Constant.CWD, `${GATHER_WORK_PATH}/dll/manifest_prod.json`);
  const MANIFEST_DEV = path.resolve(Constant.CWD, `${GATHER_WORK_PATH}/dll/manifest_dev.json`);
  const dllOption = gather.packOption.dll;
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
        externals: Config.get('externals'),
        resolve: {
          modules: [
            path.resolve(process.cwd(), './node_modules'),  // first cwd node_modules
          ],
          mainFields: ['jsnext:main', 'main'],
          extensions: ['.js', '.jsx'],
        },
        entry: {
          [BUILD_LIB]: vendors,
        },
        plugins: [
          new ProgressBarPlugin(),
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
        externals: Config.get('externals'),
        resolve: {
          modules: [
            path.resolve(process.cwd(), './node_modules'),  // first cwd node_modules
          ],
          mainFields: ['jsnext:main', 'main'],
          extensions: ['.js', '.jsx'],
        },
        entry: {
          [BUILD_VERDOR]: vendors,
        },
        plugins: [
          new ProgressBarPlugin(),
          new webpack.DefinePlugin({
            'process.env': {
              NODE_ENV: JSON.stringify('production'),
            },
          }),
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
    getBuildVendors(rev) {
      const pkg = require(path.resolve(Constant.CWD, 'package.json'));
      const result = pkg.dependencies;
      if (!rev) return result;
      if (rev.production && rev.production !== true) {
        const prevRev = rev;
        rev = rev.production;
        rev.libs = prevRev.libs;
      }
      if (isArray(rev)) {
        rev.forEach((key) => {
          result[key] = true;
        });
      } else if (isObject(rev) && isArray(rev.libs)) {
        rev.libs.forEach((key) => {
          result[key] = true;
        });
      }
      return rev ? result : null;
    },
    getDevVendors(rev) {
      const pkg = require(path.resolve(Constant.CWD, 'package.json'));
      const result = pkg.dependencies;
      if (!rev) return result;
      if (isArray(rev)) {
        rev.forEach((key) => {
          result[key] = true;
        });
      } else if (isObject(rev) && isArray(rev.libs)) {
        rev.libs.forEach((key) => {
          result[key] = true;
        });
      }
      return rev ? result : null;
    },
  };

  class HackDllReferencePlugin {
    constructor(options) {
      this.options = options;
    }
    apply(compiler) {
      compiler.plugin('before-compile', (params, callback) => {
        const manifest = this.options.manifest;
        params.compilationDependencies =
        params.compilationDependencies.filter(val => val !== manifest);
        callback();
      });
    }
}
  return {
    * beforeDev() {
      const curDlls = Setting.get(SETTING_DEV_KEY);
      const dlls = Util.getDevVendors(dllOption) || {};
      const attrList = Object.keys(dlls);
      if (!attrList || attrList.length === 0) {
        return;
      }
      if (!Util.equalObj(curDlls, dlls) || !fs.existsSync(MANIFEST_DEV)
      || !fs.existsSync(path.resolve(DEV_PATH, `${BUILD_LIB}.js`))) {
        Logger.log(`start to build 【${BUILD_LIB}.js】`);
        yield Util.generateBuildDll(Util.generateDevConfig(attrList));
        Logger.success(`build 【${BUILD_LIB}.js】 successfully!`);
        Setting.set(SETTING_DEV_KEY, dlls);
      }
    // yield Util.generateBuildDll(Util.generateDevConfig(attrList));
    // Setting.set(SETTING_DEV_KEY, dlls);
      const ddlConfig = Util.generateReferenConfig(MANIFEST_DEV);
      webpackConfig.plugins.push(new webpack.DllReferencePlugin(ddlConfig),
  new HackDllReferencePlugin(ddlConfig));
    },
    * beforeBuild() {
      const curDlls = Setting.get(SETTING_KEY);
      if (!dllOption || !dllOption.production) return;
      const dlls = Util.getBuildVendors(dllOption);
      const attrList = Object.keys(dlls);
      if (!attrList || !attrList.length === 0) {
        return;
      }
      if (!Util.equalObj(curDlls, dlls) || !fs.existsSync(MANIFEST_BUILD)
      || !fs.existsSync(path.resolve(DEST_PATH, `${BUILD_VERDOR}.js`))) {
        Logger.log(`start to build 【${BUILD_VERDOR}.js】`);
        yield Util.generateBuildDll(Util.generateBuildConfig(attrList));
        Logger.success(`build 【${BUILD_VERDOR}.js】 successfully!`);
        Setting.set(SETTING_KEY, dlls);
      }
      webpackConfig.plugins.push(new webpack.DllReferencePlugin(Util.generateReferenConfig()));
    },
  };
};
