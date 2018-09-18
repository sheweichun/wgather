const { Logger } = require('wgather-core');
const Constant = require('./constant');
const path = require('path')
;

function realPath(name) {
  return path.resolve(Constant.CWD, name);
}

const toString = Object.prototype.toString;
// const merge = Object.assign;
let config = {
  pages: 'src/pages',
  pageEntry: 'app.js',
  dest: 'build',
  publicPath: '../',
  gatherwork: '.gather',
  dllLib: 'gatherLib',
  dllVendor: 'gatherVendor',
  analyzerOpt: {},
  contentBase: [],
  otherPostCss: [],
  env: {
    'process.env': {
      NODE_ENV: JSON.stringify('production'),
    },
  },
  devEnv: {
    'process.env': {
      NODE_ENV: JSON.stringify('development'),
    },
  },
  autoprefixer: {
  },
  babel: {
    babelrc: false,
    presets: ['react', 'env'],
    plugins: [],
  },
  babelDev: {
    presets: [],
  },
  localIdentName: '[name][local]-[hash:base64:5]',
  uglyOpt: {
    beautify: false,
    comments: false,
    compress: {
      unused: true,
      dead_code: true,
      drop_console: true,
      warnings: false,
    },
    mangle: {
      except: ['$', 'exports', 'require'],
    },
    output: {
      ascii_only: true,
    },
  },
  resolve: {
    // util: realPath('src/util'),
    // styles: realPath('src/less'),
    // commons: realPath('src/components'),
    // mixins: realPath('src/mixins'),
    // actions: realPath('src/pages/isv/actions'),
    // api: realPath('src/pages/isv/api'),
  },
};

function normalizeEntry(entry) {
  const type = toString.call(entry);
  if (type === '[object String]') {
    return {
      main: [entry],
    };
  } else if (type === '[object Array]') {
    return {
      main: entry,
    };
  }
  return entry;
  // else if (type === '[object Object]') {
  //   Logger.fatal('entry only can be String or [String]');
  // }
}

module.exports = {
  get(key) {
    return config[key];
  },
  set(key, value) {
    config[key] = value;
  },
  merge(cfg) {
    if (!cfg || Object.keys(cfg).length === 0) return;
    config = Object.assign({}, config, cfg);
    if (config.dll) {
      if (typeof config.dll !== 'string' || config.dll !== false) {
        config.dll = {
          production: false,
        };
      }
    }
    if (config.entry) {
      // config.resolve = {};
      config.entry = normalizeEntry(config.entry);
      // if (config.templateHtml) {

      // }
    }
  },
};
