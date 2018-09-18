
const PLUGIN_PATH = require('./path').PLUGIN_PATH;
const path = require('path');
const fs = require('fs');

const merge = Object.assign;
const filename = 'config.json';
const filePath = path.join(PLUGIN_PATH, filename);
const requireFile = () => require(filePath);
const clearCache = () => delete require.cache[filePath];
const fmtb = (value) => {
  if (value === 'true') {
    return true;
  } else if (value === 'false') {
    return false;
  }

  return value;
};

const defaultConfig = {
  pm: {
    install: 'install',
    uninstall: 'uninstall',
    update: 'update',
    name: 'npm',
    registry: 'https://registry.npm.taobao.org',
  },
  gitlab_token: '',
  packVersionCheck: 'a',
  updateCheck: true,
  github: '',
  author: '',
};

const Config = {
  init() {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultConfig, null, 2));
    } else {
      const newConfig = merge({}, defaultConfig, requireFile());
      fs.writeFileSync(filePath, JSON.stringify(newConfig, null, 2));
      clearCache();
    }
  },
  get(option) {
    if (!option) {
      return requireFile();
    }

    return requireFile()[option];
  },
  set(option, value) {
    const config = requireFile();

    if (Object.prototype.hasOwnProperty.call(defaultConfig, option)) {
      config[option] = fmtb(value);
      fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
      clearCache();
      return true;
    }

    return false;
  },
  update(option, value) {
    const config = requireFile();
    if (!option) {
      const newConfig = merge({}, defaultConfig, config);
      fs.writeFileSync(filePath, JSON.stringify(newConfig, null, 2));
      clearCache();
      return true;
    }
    return Config.set(option, value);
  },
};

module.exports = Config;

