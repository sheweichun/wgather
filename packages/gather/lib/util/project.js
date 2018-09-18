const { PLUGIN_PATH } = require('./path');
const fs = require('fs');
const path = require('path');
const Logger = require('./logger');

const filename = 'project.json';
const filePath = path.join(PLUGIN_PATH, filename);
const requireFile = () => require(filePath);
module.exports = {
  check() {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
    }
  },
  get(option) {
    if (!option) {
      return requireFile();
    }
    return requireFile()[option];
  },
  set(option, value) {
    if (Object.prototype.toString.call(value) !== '[object Object]') {
      Logger.fatal('in project config,value must be Object!');
    }
    const config = requireFile();
    if (config[option]) {
      value.updateTime = Date.now();
      value.createTime = config[option].createTime;
    } else {
      value.updateTime = Date.now();
      value.createTime = Date.now();
    }
    config[option] = value;
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
  },
  sync() {
    const config = requireFile();
    const newConfig = {};
    Object.keys(config).forEach((fp) => {
      const item = config[fp];
      if (fs.existsSync(path.resolve(fp, item.configFile))) {
        newConfig[fp] = item;
      }
    });
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
  },
}
;
