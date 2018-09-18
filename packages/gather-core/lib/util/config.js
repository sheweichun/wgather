
const path = require('path');
const homeDir = require('os').homedir();
const PLUGIN_PATH = path.join(homeDir, '.gather');

const fs = require('fs');




const formatBoolean = (value) => {
  if (value === 'true') {
    return true;
  } else if (value === 'false') {
    return false;
  }

  return value;
};

module.exports = (name,attrName,defaultConfig={})=>{
    const filePath = path.join(PLUGIN_PATH, name);
    const requireFile = () => require(filePath);
    return {
        init() {
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, JSON.stringify({[attrName]:defaultConfig}, null, 2));
                return;
            }
            let config = requireFile();
            if(!config[attrName]){
                config[attrName] = defaultConfig;
                fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
            }
        },
        get(option) {
            if (!option) {
                return requireFile();
            }
            return requireFile()[attrName][option];
        },
        set(option, value) {
            const config = requireFile();
            config[attrName][option] = formatBoolean(value);
            fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
            return true;
            // if (Object.prototype.hasOwnProperty.call(defaultConfig, option)) {
                
            // }
            // return false;
        },
    }
};

