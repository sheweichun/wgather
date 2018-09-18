
const Constant = require('./constant');
const path = require('path')
;

function realPath(name) {
  return path.resolve(Constant.CWD, name);
}

let config = {
  pages: 'src/pages',
  pageEntry: 'app.js',
  dest: 'build',
  gatherwork: '.gather',
  dllLib: 'gatherLib',
  dllVendor: 'gatherVendor',
  analyzerOpt: {},
  autoprefixer: {
  },
  babel: {
    presets: ['react', ['es2015', { modules: false }], 'stage-0'],
    plugins: [
      'transform-decorators-legacy',
      [
        'next',
        {
          jsName: '@alife/next',
          cssName: '@alife/next',
          dir: 'lib',
          noStyle: true,
        },
      ],
    ],
    env: {
      development: {
        presets: ['react-hmre'],
      },
    },
  },
  localIdentName: '[name][local]-[hash:base64:5]',
  uglyOpt: {
    compress: {
      unused: true,
      dead_code: true,
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
    util: realPath('src/util'),
    styles: realPath('src/less'),
    commons: realPath('src/components'),
    mixins: realPath('src/mixins'),
    actions: realPath('src/pages/isv/actions'),
    api: realPath('src/pages/isv/api'),
  },
};

module.exports = {
  get(key) {
    return config[key];
  },
  set(key, value) {
    config[key] = value;
  },
  merge(cfg) {
    config = Object.assign({}, config, cfg);
  },
};
