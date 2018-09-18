

/**
 * option
 *
 *
 * packType:  webpack rollup
 * packName
 * packOption
 * pluginList
 * config
 *
 */


const path = require('path');
const logger = require('./logger');

/**
 * 装配配置文件
 * @param  {string} filename   文件名
 * @return {object}            配置内容
 */
module.exports = function (filename) {
  const configPath = path.join(process.cwd(), filename);
  let config;

  // load config
  try {
    config = require(configPath);
  } catch (e) {
    logger.error('Failed to read the config.');
    logger.fatal(e.stack);
  }
  if (!config.packName) {
    logger.fatal('packName is needed in config file');
  }
  config.name = filename;


  return config;
};
