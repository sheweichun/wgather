

const path = require('path');
const homeDir = require('os').homedir();
const fs = require('fs');
// const shelljs = require('shelljs');

const ROOT_PATH = path.join(__dirname, '../../');
// const pkg = require('../../package.json');

const PLUGIN_PATH = path.join(homeDir, '.gather');
const PACK_PATH = path.join(PLUGIN_PATH, 'packers');
const PLUGINS_PATH = path.join(PLUGIN_PATH, 'plugins');
const GENERATOR_PATH = path.join(PLUGIN_PATH, 'generators');
// exports.CWD_PATH = process.cwd();
exports.ROOT_PATH = ROOT_PATH;
exports.PLUGIN_PATH = PLUGIN_PATH;
exports.PLUGINS_PATH = PLUGINS_PATH;
exports.GENERATOR_PATH = GENERATOR_PATH;
exports.LIB_PATH = path.join(ROOT_PATH, 'lib');
exports.PACK_PATH = PACK_PATH;

exports.isLocalExist = function (name) {
  const pkgPath = path.resolve(PLUGIN_PATH, 'node_modules', name);
  if (!fs.existsSync(pkgPath)) {
    return false;
  }
  return true;
};
