
const Config = require('./config');
const Logger = require('./logger');

let gitlabToken = Config.get('gitlab_token');

let client;


function* checkToken() {
  if (!gitlabToken) {
    const chalk = require('chalk');
    const inquirer = require('inquirer');
    Logger.warn(`open ${chalk.underline.yellow('http://gitlab.alibaba-inc.com/profile/account')},get your Private token!`);
    const answer = yield inquirer.prompt([
      {
        type: 'input',
        name: 'token',
        message: '请输入你的gitlab private token',
      },
    ]);
    gitlabToken = answer.token;
    Config.set('gitlab_token', gitlabToken);
  }
}
// http://gitlab.alibaba-inc.com/help/api/groups.md
class GitlabClient {
  constructor(url, token) {
    this.baseUrl = `${url}/api/v3`;
    this.token = token;
    const { HttpClient2 } = require('urllib');
    this.urllib = new HttpClient2({
      defaultArgs: {
        dataType: 'json',
        headers: {
          'PRIVATE-TOKEN': token,
        },
      },
    });
  }
  * request(url, ...args) {
    const ret = yield this.urllib.request(this.baseUrl + url, ...args);
    return ret.data;
  }
  * getProjectsByGroup(id, query) {
    return yield this.request(`/groups/${id}/projects`, {
      data: query,
    });
  }
  * getProjectByGIdAndPid(gid, pid) {
    return yield this.request(`/projects/${encodeURIComponent(`${gid}/${pid}`)}`);
  }
  * getTagsByPid(id) {
    return yield this.request(`/projects/${id}/repository/tags`);
  }
  * getUsers() {
    return yield this.request('/user');
  }
  * getNameSpaceId(group) {
    return yield this.request(`/namespaces?search=${group}`);
  }
  * createRepository(pid) {
    const inquirer = require('inquirer');
    let result = yield inquirer.prompt([
      {
        type: 'confirm',
        message: '是否需要创建远程仓库',
        name: 'createFlag',
      },
    ]);
    if (!result.createFlag) return Promise.resolve(false);
    result = yield inquirer.prompt([
      {
        type: 'input',
        default: 'taefed',
        message: '仓库组',
        validate(val) { return val ? true : '仓库组不能为空'; },
        name: 'group',
      }, {
        type: 'input',
        default: pid,
        message: '仓库名',
        validate(val) { return val ? true : '仓库名不能为空'; },
        name: 'project',
      }, {
        type: 'input',
        message: '仓库描述',
        validate(val) { return val ? true : '仓库描述不能为空'; },
        name: 'description',
      },
    ]);
    const { group, project, description } = result;
    const createName = `${group}/${project}`;
    const nameSpaceInfo = yield this.getNameSpaceId(group);
    Logger.log(`开始创建【${createName}】...`);
    // console.log('nameSpaceInfo :', nameSpaceInfo);
    const ret = yield this.request('/projects', {
      method: 'POST',
      data: {
        name: project,
        namespace_id: nameSpaceInfo[0].id,
        description,
      },
    });
    if (ret.message) {
      Logger.error(ret.message);
    } else {
      Logger.success(`【${createName}】创建成功!`);
    }
    return Promise.resolve(ret.ssh_url_to_repo);
  }
  // * createLocalRepository() {

  // }
  // * getProjectByGIdAndPid(gid, pid) {
  //   return yield this.request(`/groups/${gid}/projects/${pid}`);
  // }
}


module.exports = function* () {
  if (client) return client;
  yield checkToken();
  return new GitlabClient('http://gitlab.alibaba-inc.com', gitlabToken);
}
;
