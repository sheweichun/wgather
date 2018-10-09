
const Util = require('./util/index');
const path = require('path');
const Config = require('./util/config');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const webpack = require('webpack');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const Constant = require('./util/constant');
const { TypeCheck } = require('wgather-core');

const { isObject } = TypeCheck;

let HappyPack;
let happyThreadPool;
// const HappyPack = require('happypack');
// const os = require('os');
// const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length });

const cwd = Constant.CWD;
const ROOT_PATH = Constant.ROOT_PATH;
const merge = Object.assign;
const localIdentName = Config.get('localIdentName');
const CSS_LOADER = {
  loader: 'css-loader',
  options: {
    modules: false,
    minimize: true,
    localIdentName,
  },
};
const POSTCSS_LOADER = {
    loader: 'postcss-loader',
    options: {
      config: {
        path: path.resolve(__dirname, 'postcss.config.js'),
      },
    },
  },
  LESS_LOADER = { loader: 'less-loader' },
  SASS_LOADER = { loader: 'sass-loader' };
const CSS_NO_LOADER = {
  loader: 'css-loader',
  options: {
    modules: false,
    minimize: true,
  },
};

// const workLoaders = {
//   test: /\.worker\.js$/,
//   exclude: /node_modules/,
//   use: [{ loader: 'worker-loader' }, {
//     loader: 'babel-loader',
//     options: babelOption,
//   }],
// };
function getWorkerLoader(isDev) {
  let babelOption = Config.get('babel');
  if (isDev) {
    babelOption = merge({}, babelOption, {
      env: {
        development: Config.get('babelDev'),
      },
    });
  }
  return {
    test: /\.worker\.js$/,
    exclude: /node_modules/,
    use: [{
      loader: 'worker-loader',
      options: {
        // plugins: [
        //   new ExtractTextPlugin('[name].bundle.css', {
        //     allChunks: true,
        //   }),
        // ],
      },
    }, {
      loader: 'babel-loader',
      options: babelOption,
    }],
  };
}
function getNormalLoaders(isDev) {
  let babelOption = Config.get('babel');
  if (isDev) {
    babelOption = merge({}, babelOption, {
      env: {
        development: Config.get('babelDev'),
      },
    });
  }
  const jsLoaders = {
    test: /\.jsx?$/,
    exclude: /node_modules/,
    use: [{
      loader: 'babel-loader',
      options: babelOption,
    }],
  };

  // if (dev) {
  //   jsLoaders.use.unshift({
  //     loader: 'react-hot-loader/webpack',
  //   });
  // }
  return [
    // workLoaders,
    jsLoaders, {
      test: /\.(png|jpg|gif|ico|eot|otf|ttf|woff|woff2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      use: [{
        loader: 'url-loader',
        options: Config.get('urlLoader') || {
          limit: 8192,
        },
      }],
    },
  ];
}

function initHappypack() {
  HappyPack = require('happypack');
  const os = require('os');
  happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length });
}

function initStyleLoadersAndPlugins(loaders, plugins, item, index, needHappypack) {
  if (!needHappypack) {
    loaders.push({
      test: item.test,
      exclude: item.exclude,
      include: item.include,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: item.use,
      }),
    });
    return;
  }
  const id = `style${index}`;
  loaders.push({
    test: item.test,
    exclude: item.exclude,
    include: item.include,
    use: ExtractTextPlugin.extract({
      fallback: 'style-loader',
      use: `happypack/loader?id=${id}`,
    }),
  });
  plugins.push(new HappyPack({
    id,
    threadPool: happyThreadPool,
    verbose: false,
    loaders: item.use.map(ld => ({
      loader: ld.loader,
      query: ld.options || {},
    })),
  }));
}

function initDevStyleLoadersAndPlugins(loaders, plugins, item, index, needHappypack) {
  if (!needHappypack) {
    loaders.push({
      test: item.test,
      exclude: item.exclude,
      include: item.include,
      use: item.node_module ? ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: item.use,
      }) : [{
        loader: 'style-loader',
      }].concat(item.use),
    });
    return;
  }
  const id = `style${index}`;
  loaders.push({
    test: item.test,
    exclude: item.exclude,
    include: item.include,
    use: item.node_module ? ExtractTextPlugin.extract({
      fallback: 'style-loader',
      use: `happypack/loader?id=${id}`,
    }) : [`happypack/loader?id=${id}`],
  });
  plugins.push(new HappyPack({
    id,
    threadPool: happyThreadPool,
    verbose: false,
    loaders: (item.node_module ? [] : [{ loader: 'style-loader' }]).concat(item.use.map(ld => ({
      loader: ld.loader,
      query: ld.options || {},
    }))),
  }));
}

function initStyleLoaders(packOpt, nominify, modules) {
  const { css, less, sass } = packOpt;
  const styleLoades = [];
  if (css || less || sass) {
    styleLoades.push({
      test: /\.css$/,
      include: /node_module/,
      node_module: true,
      use: [CSS_NO_LOADER],
    }, {
      test: /\.css$/,
      exclude: /node_module/,
      use: [CSS_LOADER],
    });
  }
  if (less) {
    styleLoades.push({
      test: /\.less$/,
      exclude: /node_module/,
      use: [CSS_LOADER, POSTCSS_LOADER, LESS_LOADER],
    }, {
      test: /\.less$/,
      include: /node_module/,
      node_module: true,
      use: [CSS_NO_LOADER, POSTCSS_LOADER, LESS_LOADER],
    });
  }
  if (sass) {
    styleLoades.push({
      test: /\.scss$/,
      exclude: /node_module/,
      use: [CSS_LOADER, POSTCSS_LOADER, SASS_LOADER],
    }, {
      test: /\.scss$/,
      include: /node_module/,
      node_module: true,
      use: [CSS_NO_LOADER, POSTCSS_LOADER, SASS_LOADER],
    });
  }
  CSS_LOADER.options = CSS_LOADER.options || {};
  if (nominify) {
    CSS_LOADER.options.minimize = false;
    CSS_NO_LOADER.options.minimize = false;
  }
  CSS_LOADER.options.modules = modules;
  return styleLoades;
}

function initNomalLoadersAndPlugins(loaders, plugins, item, index, needHappypack) {
  if (!needHappypack) {
    loaders.push({
      test: item.test,
      exclude: item.exclude,
      include: item.include,
      use: item.use,
    });
    return;
  }
  const id = `normal${index}`;
  loaders.push({
    test: item.test,
    exclude: item.exclude,
    include: item.include,
    use: [`happypack/loader?id=${id}`],
  });
  plugins.push(new HappyPack({
    id,
    threadPool: happyThreadPool,
    verbose: false,
    loaders: item.use.map(ld => ({
      loader: ld.loader,
      query: ld.options || {},
    })),
  }));
}

const Base = {
  getBaseConfig(dirList = []) {
    return {
      context: ROOT_PATH,
      module: {
        rules: [],
      },
      externals: Config.get('externals'),
      resolve: {
        modules: [
          path.resolve(cwd, './node_modules'),  // first cwd node_modules
          path.resolve(__dirname, '../node_modules'),
        ].concat(dirList),
        mainFields: ['jsnext:main', 'main'],
        extensions: ['.js', '.jsx', '.css', 'scss', 'less'],
        alias: Util.getResolve(),
      },
      plugins: [],
    };
  },
  getDevConfig(baseConfig, cmdConfig = {}, option) {
    const hasDll = !!option.dll;
    const pages = Util.getPages(true, hasDll, option.entries, true);
    const otherPlugins = [];
    if (!hasDll && option.common) {
      otherPlugins.push(new webpack.optimize.CommonsChunkPlugin(option.common));
    }
    const webpackConfig = merge({}, baseConfig, {
      entry: pages.entries,
      output: {
        path: path.resolve(cwd, Config.get('dest')),
        publicPath: '/',
        filename: '[name].js',
        chunkFilename: '[name].js',
      },
      devtool: 'inline-source-map',
      plugins: [],
    }, cmdConfig.dev);
    webpackConfig.plugins = webpackConfig.plugins || [];
    webpackConfig.plugins = webpackConfig.plugins.concat(baseConfig.plugins.concat([
      new webpack.HotModuleReplacementPlugin(),
      new ExtractTextPlugin('[name].bundle.css', {
        allChunks: true,
      }),
      new webpack.DefinePlugin(Config.get('devEnv')),
      new webpack.NamedModulesPlugin(),
      new ProgressBarPlugin(),
    ], pages.plugins, otherPlugins));
    // console.log('webpackConfig.entry :', webpackConfig.entry);
    return webpackConfig;
  },
  getBuildConfig(baseConfig, cmdConfig = {}, option) {
    const hasDll = !!option.dll;
    const otherPlugins = [];
    // if ((!hasDll || (isObject(option.dll) && option.dll.production === false)) && option.common) {
    //   otherPlugins.push(new webpack.optimize.CommonsChunkPlugin(option.common));
    // }
    const pages = Util.getPages(false, false, option.entries, false);
    const webpackConfig = merge({}, baseConfig, {
      entry: pages.entries,
      output: {
        path: path.resolve(cwd, Config.get('dest')),
        publicPath: Config.get('publicPath'),
        filename: '[name].js',
        chunkFilename: '[name].js',
      },
      devtool: 'source-map',
      plugins: [],
    }, cmdConfig.build);
    webpackConfig.plugins = webpackConfig.plugins || [];
    webpackConfig.plugins = webpackConfig.plugins.concat(baseConfig.plugins.concat([
      new ExtractTextPlugin('[name].bundle.css', {
        allChunks: true,
      }),
      new webpack.optimize.OccurrenceOrderPlugin(true),
      new webpack.DefinePlugin(Config.get('env')),
      new ProgressBarPlugin(),
    ], pages.plugins, otherPlugins));
    if (!webpackConfig.externals) {
      webpackConfig.externals = {};
    }
    webpackConfig.externals.medivh = 'Medivh';
    webpackConfig.externals['medivh-runtime'] = 'MedivhRuntime';
    webpackConfig.externals['medivh-redux'] = 'MedivhRedux';
    webpackConfig.externals['medivh-router'] = 'MedivhRouter';

    webpackConfig.externals['worker-react'] = 'Medivh';
    webpackConfig.externals['worker-react-runtime'] = 'MedivhRuntime';
    webpackConfig.externals['worker-react-redux'] = 'MedivhRedux';
    webpackConfig.externals['worker-react-router'] = 'MedivhRouter';
    return webpackConfig;
  },
  getBuildLoadesAndPlugins(packOpt = {}, nominify) {
    const styleLoades = initStyleLoaders(packOpt, nominify, packOpt.modules);
    const loaders = [],
      plugins = [];
    if (packOpt.happypack) {
      initHappypack();
    }
    styleLoades.forEach((item, index) => {
      initStyleLoadersAndPlugins(loaders, plugins, item, index, packOpt.happypack);
    });
    getNormalLoaders().forEach((item, index) => {
      initNomalLoadersAndPlugins(loaders, plugins, item, index, packOpt.happypack);
    });
    return {
      loaders,
      plugins,
    };
  },
  getDevLoadesAndPlugins(packOpt = {}) {
    const styleLoades = initStyleLoaders(packOpt, false, packOpt.modules);
    const loaders = [getWorkerLoader(true)],
      plugins = [];
    if (packOpt.happypack) {
      initHappypack();
    }
    styleLoades.forEach((item, index) => {
      initDevStyleLoadersAndPlugins(loaders, plugins, item, index, packOpt.happypack);
    });
    getNormalLoaders(true).forEach((item, index) => {
      initNomalLoadersAndPlugins(loaders, plugins, item, index, packOpt.happypack);
    });
    return {
      loaders,
      plugins,
    };
  },
};
Base.checkList = [];
// Base.checkList = [{
//   name: 'babel-preset-stage-0',
// }, {
//   name: 'babel-preset-es2015',
// }, {
//   name: 'babel-preset-react',
// }, {
//   name: 'babel-plugin-transform-decorators-legacy',
// }, {
//   name: 'babel-plugin-next',
// },
// {
//   name: 'babel-preset-react-hmre',
// },
// ];

module.exports = Base;
