
// const path = require('path');
// const fs = require('fs');
const { ConcatSource } = require('webpack-sources');
const dayjs = require('dayjs');
const { Packer, Logger } = require('@ali/gather-core');


const Constant = require('./util/constant');
const DllPlugin = require('./plugin/dll');
const webpack = require('webpack');
const Base = require('./base');
// const Dll = require('./dll');

const Config = require('./util/config');

const merge = Object.assign;

function autoInstall(compiler, gather, config) {
  const prevResolve = compiler.resolvers.normal.resolve;
  compiler.resolvers.normal.resolve = function (...args) {
    const cb = args[args.length - 1];
    if (typeof cb === 'function') {
      args[args.length - 1] = function (...cbargs) {
        let resource = args[2];
          // && !config.resolve.alias[getModuleByResource(resource)]
        if (cbargs[0] && resource) {
          const resArr = resource.split('/');
          resource = resArr[0];
          if (!resource || resource.indexOf('.') >= 0 || config.resolve.alias[resource]) {
            return cb(...cbargs);
          }
          console.log();
          Logger.warn(`【${resource}】will installed `);
          const ret = gather.installPackage(Constant.CWD, resource);
          if (ret) {
            Logger.error(ret);
          } else {
            Logger.success(`【${resource}】installed successfully!`);
          }
          args[args.length - 1] = cb;
            /*eslint-disable*/
            compiler.inputFileSystem._statStorage.data.clear();
            /*eslint-enable*/
          prevResolve.apply(compiler.resolvers.normal, args);

          return;
        }
        cb(...cbargs);
      };
    }
    prevResolve.apply(compiler.resolvers.normal, args);
  };
}


function checkNull(obj, key, defaultValue) {
  if (obj[key] == null) {
    obj[key] = defaultValue;
  }
}

function addComment(compiler, content) {
  if (!content) return;
  const comment = `//${content} ${dayjs().format('YYYY-MM-DD HH:mm:ss')}\n`;
  if (compiler.hooks && compiler.hooks.compilation && compiler.hooks.compilation.tap) {
    compiler.hooks.compilation.tap('CommentBannerPlugin', (compilation) => {
      compilation.hooks.afterOptimizeChunkAssets.tap('CommentBannerPlugin', (chunks) => {
        for (const chunk of chunks) {
          if (!chunk.canBeInitial()) {
            continue;
          }
          chunk.files.forEach((file) => {
            if (/\.js$|\.jsx$/.test(file)) {
              compilation.assets[file] = new ConcatSource(
                comment,
                '\n',
                compilation.assets[file],
              );
            }
          });
        }
      });
    });
  } else {
    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('after-optimize-chunk-assets', (chunks) => {
        chunks.forEach((chunk) => {
          try {
            if (!chunk.initial) return;
          } catch (e) {
            if (!chunk.isInitial()) return;
          }
          chunk.files.forEach((file) => {
            if (/\.js$|\.jsx$/.test(file)) {
              compilation.assets[file] = new ConcatSource(
                comment,
                '\n',
                compilation.assets[file],
              );
            }
          });
        });
      });
    });
  }
}

module.exports = class WebPackPacker extends Packer {
  constructor(gather) {
    super(gather);
    this.packOption = typeof gather.packOption === 'function' ? gather.packOption({
      context: Constant.ROOT_PATH,
    }) : gather.packOption;
    const packOption = this.packOption;
    this.webpackBaseConfig = packOption.webpackConfig || {};
    Config.merge(packOption.config);
    this.checkList = Base.checkList;
    // console.log('packOption :', this.packOption);
    if (this.packOption.dll) {
      this.gather.pluginList.push(DllPlugin);
    }
    checkNull(packOption, 'autoInstall', true);
    checkNull(packOption, 'common', {
      name: 'vendor',
      filename: 'vendor.js',
    });
  }
  getBuildConfig() {
    const { nominify, visual, entries } = this.gather.option;
    const webpackConfig = Base.getBuildConfig(
      Base.getBaseConfig(this.gather.moduleDirList),
      this.webpackBaseConfig, merge({ entries }, this.packOption));
    const ret = Base.getBuildLoadesAndPlugins(this.packOption, nominify);
    webpackConfig.module.rules = webpackConfig.module.rules.concat(ret.loaders);
    // webpackConfig.plugins = webpackConfig.plugins.concat(ret.plugins);
    webpackConfig.plugins = ret.plugins.concat(webpackConfig.plugins);
    const uglyOpt = Config.get('uglyOpt');
    // console.log('uglyOpt :', uglyOpt);
    if (!nominify && uglyOpt) {
      const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
      webpackConfig.plugins.push(new UglifyJsPlugin({
        parallel: true,
        sourceMap: true,
        uglifyOptions: uglyOpt,
      }));
    }
    if (visual) {
      const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
      webpackConfig.plugins.push(new BundleAnalyzerPlugin(Config.get('analyzerOpt')));
    }
    // console.log('plugins => :', webpackConfig.plugins);
    // Dll.getVendors();
    return Promise.resolve(webpackConfig);
  }
  build(config) {
    const compiler = webpack(config);
    const cleanStats = function (stats) {
      stats.compilation.children = stats.compilation.children.filter(child => !/extract-text-webpack-plugin|html-webpack-plugin/.test(child.name));
    };
    addComment(compiler, Config.get('comment'));
    compiler.plugin('done', (stats) => {
      cleanStats(stats);
    });

    compiler.run((err, stats) => {
      if (err) {
        Logger.fatal(err);
      }

      const statConfig = {
        // colors: program.color,
        chunks: false,
        hash: false,
        version: false,
      };

      if (stats.hasErrors()) {
        Logger.fatal(stats.toString(statConfig));
      }

      Logger.success(`info\n${stats.toString(config)}`);
    });
  }
  getDevConfig() {
    const { visual, entries } = this.gather.option;
    const webpackConfig = Base.getDevConfig(
      Base.getBaseConfig(this.gather.moduleDirList, this.packOption),
      this.webpackBaseConfig, merge({ entries }, this.packOption));
    const ret = Base.getDevLoadesAndPlugins(this.packOption);
    webpackConfig.module.rules = webpackConfig.module.rules.concat(ret.loaders);
    // webpackConfig.plugins = webpackConfig.plugins.concat(ret.plugins);
    webpackConfig.plugins = ret.plugins.concat(webpackConfig.plugins);
    if (visual) {
      const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
      webpackConfig.plugins.push(new BundleAnalyzerPlugin(Config.get('analyzerOpt')));
    }
    return Promise.resolve(webpackConfig);
  }
  // checkPackageRequire(map, p) {
  //   console.log('go here');
  //   if (map[p] || !p) return;
  //   const strArr = p.split('/').filter(val => val.indexOf('.') < 0 && !!val) || [];
  //   if (strArr.length === 0) return;
  //   const pathName = path.resolve(Constant.CWD, 'node_modules', strArr[0]);
  //   if (!fs.existsSync(pathName)) {
  //     try {
  //       this.gather.installPackage(Constant.CWD, p);
  //     } catch (e) {
  //       Logger.error(e);
  //     }
  //   }
  // }
  dev(config) {
    const { port = 9000 } = this.gather.option;
    const self = this;
    const open = require('open');
    const express = require('express');
    const app = express();
    let startFlag = false;
    let host = `http://localhost:${port}${config.output.publicPath}`;
    const templateHtml = Config.get('templateHtml');
    let defaultPage,
      suffix = templateHtml && templateHtml.filename ? templateHtml.filename : 'index.html';
    Object.keys(config.entry).forEach((item) => {
      config.entry[item].unshift('webpack-hot-middleware/client?reload=true');
      if (!defaultPage) {
        defaultPage = item.substr(0, item.indexOf('/'));
      }
    });
    if (!defaultPage) {
      defaultPage = '';
    } else {
      suffix = `/${suffix}`;
    }
    host = `${host + defaultPage}${suffix}`;
    const compiler = webpack(config);
    addComment(compiler, Config.get('comment'));
    compiler.plugin('done', () => {
      if (startFlag) return;
      startFlag = true;
      Logger.log(`listening on ${host}....`);
      open(host, (err) => {
        if (err) { Logger.error(err); }
        // this.gather.hookRequire(this.checkPackageRequire.bind(this, config.resolve.alias));
      });
    });
    // NormalModuleFactory plugin('factory')
    // compiler.plugin('normal-module-factory', (nmf) => {
      // nmf.plugin('before-resolve', (result, callback) => {
      //   console.log('request :', result.request);
      //   callback(null, result);
      // });
      // nmf.plugin('factory', (result) => {
      //   if (typeof result === 'function') {
      //     return (ret, callback) => {
      //       result(ret, (...args) => {
      //         console.log('err :', args[0]);
      //         callback(...args);
      //       });
      //     };
      //   }
      //   return result;
      //   // callback(null, result);
      // });
    // });
    if (this.packOption.autoInstall) {
      autoInstall(compiler, self.gather, config);
    }
    Logger.log('Enabling webpack dev middleware.');
    Logger.log('Enabling Webpack Hot Module Replacement (HMR).');
    const contentBase = Config.get('contentBase') || [];
    contentBase.forEach((cb) => {
      if (!cb.name) {
        app.use(express.static(cb.path));
      } else {
        app.use(cb.name, express.static(cb.path));
      }
    });
    app.use(express.static(Constant.CWD));
    app.use(require('webpack-dev-middleware')(compiler, {
      lazy: false,
      noInfo: true,
      publicPath: config.output.publicPath,
      quiet: false,
      stats: {
        colors: true,
      },
    }));
    app.use(require('webpack-hot-middleware')(compiler, {
      reload: true,
      noInfo: true,
      quiet: true,
    }));

    app.listen(port, () => {

    });
  }
}
;
