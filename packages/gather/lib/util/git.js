
const Logger = require('./logger');
const shelljs = require('shelljs');

function exec(cmd) {
  const ret = shelljs.exec(cmd, { silent: true });
  if (ret.code !== 0) {
    Logger.error(ret.output);
    return false;
  }
  return true;
}

const Util = {
  init(url, message = 'init') {
    Logger.log('创始化本地仓库');
    exec('git init');
    Util.trackRemote(url);
    exec('git add -A .');
    exec(`git commit -m ${message}`);
    if (url) {
      exec('git push -u origin master');
      Logger.success('推送远程master分支成功');
    } else {
      Logger.success('本地仓库初始化成功');
    }
  },
  createAndTrackBranch(branchName) {
    Logger.log(`创建【${branchName}】分支`);
    exec(`git checkout -b ${branchName}`);
    exec(`git push -u origin ${branchName}`);
    Logger.log(`推送到远程分支【${branchName}】`);
  },
  trackRemote(url) {
    if (!url) return;
    Logger.log(`关联远程仓库【${url}】`);
    exec(`git remote add origin ${url}`);
  },
}
;

module.exports = Util;
