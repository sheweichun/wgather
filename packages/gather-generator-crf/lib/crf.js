

const GROUP = 'gather';
const path = require('path');
const fs = require('fs');

module.exports = class CloudRetailFront {
  constructor(generator) {
    this.generator = generator;
  }
  * getConfig(getGitClient) {
    const { option } = this.generator;
    const client = yield getGitClient();
    let template;
    const questions = [{
      type: 'input',
      name: 'projectName',
      validate: (val) => {
        if (!val) {
          return '项目名不能为空';
        } else if (fs.existsSync(path.resolve(process.cwd(), val))) {
          return `当前目录下已存在【${val}】`;
        }
        return true;
      },
      message: '请输入项目名',
    }];
    if (option.project) {
      // template = option.project;
      const project = yield client.getProjectByGIdAndPid(GROUP, option.project);
      template = project;
    } else {
      const projects = yield client.getProjectsByGroup(GROUP, {
        per_page: 100,
        archived: true,
      });
      questions.push({
        type: 'list',
        name: 'template',
        message: '请输入模板的gitlab仓库名',
        choices: projects.map(p => ({
          name: `【${p.name}】 ${p.description}`,
          value: p,
        })),
      });
    }
    const config = yield this.generator.inquirer.prompt(questions);
    if (template) {
      config.template = template;
    }
    const tags = yield client.getTagsByPid(config.template.id);
    if (!tags || tags.length === 0) {
      return Promise.reject(`【${config.template.name}】you choose has no tag`);
    }
    const ret = yield this.generator.inquirer.prompt([
      {
        type: 'list',
        name: 'tag',
        message: `请选择${config.template.name}的release版本`,
        choices: tags.map(p => ({
          name: `【${p.name}】 ${p.commit.message}`,
          value: p.name,
        })),
      },
    ]);
    config.tag = ret.tag;
    const users = yield client.getUsers();
    config.name = users.name;
    config.email = users.email;
    return config;
  }
  * generate(getGitClient, config) {
    const client = yield getGitClient();
    const { template, tag, projectName } = config;
    const downPath = yield this.generator.downloader.downloadProjectFromGitlab(path.resolve(process.cwd(), projectName), template.name, tag);
    // console.log('downPath :',downPath);
    // const fs = require('fs');

    // this.generator.npmInstall(downPath, '');
    const url = yield client.createRepository(projectName);
    this.generator.changePwd(downPath);
    const gitClient = this.generator.gitClient;
    gitClient.init(url);
    if (url) {
      const ret = yield this.generator.inquirer.prompt([
        {
          type: 'confirm',
          name: 'flag',
          message: '是否创建daily/0.0.1',
        },
      ]);
      if (ret.flag) {
        gitClient.createAndTrackBranch('daily/0.0.1');
      }
    }
    this.generator.restorePwd();
    // yield this.generator.downloader.upzip(downPath);
  }

}
;
