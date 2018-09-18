

const shelljs = require('shelljs');
// const exec = require('./exec');
const PLUGIN_PATH = require('./path').PLUGIN_PATH;
const Config = require('./config');
const Logger = require('./logger');
// const pm = {
//   install: 'install',
//   uninstall: 'uninstall',
//   update: 'update',
//   name: 'tnpm',
//   registry: '',
// };
const pm = Config.get('pm');

function checkRegistry(registry) {
  if (!registry) {
    return '';
  }

  return `--registry=${registry}`;
}

const npm = (options, opt = {}) => {
  let { registry } = opt;
  const { cwd = PLUGIN_PATH } = opt;
  registry = registry || pm.registry;

  if (registry) {
    options.push(checkRegistry(registry));
  }

  const pwd = shelljs.pwd();

  shelljs.cd(cwd);
  // '--save-prefix=>='
  options = options.concat(['--save']);
  // console.log('cwd :', cwd);
  // console.log(`exec ===>  ${pm.name} ${options.join(' ')}`);
  shelljs.exec(`${pm.name} ${options.join(' ')}`, { silent: true });
//   exec(pm.name, options, { stdio: 'inherit' });
  shelljs.cd(pwd);
};


exports.tarInstall = (dir, name, opts = {}) => {
  let options = [pm.install, name];
  if (opts.registry) {
    options.push(checkRegistry(opts.registry));
  }
  const pwd = shelljs.pwd();
  shelljs.cd(dir);
  options = options.concat([opts.dev ? '--save-dev' : '--save', '--silent']);
  const ret = shelljs.exec(`${pm.name} ${options.join(' ')}`, { silent: true });
  shelljs.cd(pwd);
  if (ret.code !== 0) {
    return `install ${name} fail!`;
  }
};

exports.npmInstall = (dir, opts = {}) => {
  Logger.log(`正在运行【${pm.name} ${pm.install}】`);
  let options = [pm.install];
  if (opts.registry) {
    options.push(checkRegistry(opts.registry));
  }
  const pwd = shelljs.pwd();
  shelljs.cd(dir);
  options = options.concat(['--silent']);
  const ret = shelljs.exec(`${pm.name} ${options.join(' ')}`);
  shelljs.cd(pwd);
  if (ret.code !== 0) {
    Logger.error(`运行【${pm.name} ${pm.install}】失败!\n${ret.output}`);
    return false;
  }
  Logger.success(`运行【${pm.name} ${pm.install}】成功!`);
  return true;
};

exports.install = (name, opts) => npm([pm.install].concat(name), opts);
exports.update = (name, opts) => npm([pm.update].concat(name), opts);
exports.uninstall = (name, opts) => npm([pm.uninstall].concat(name), opts);
exports.list = () => npm(['list', '--depth=0']);
