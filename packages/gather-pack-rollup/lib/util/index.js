
const path = require('path');
const fs = require('fs');
const Config = require('./config');
const Constant = require('./constant');

const cwd = Constant.CWD;

function checkFile(projects, name) {
  if (!projects || projects.length === 0) return true;
  for (let j = 0; j < projects.length; j++) {
    if (new RegExp(projects[j]).test(name)) {
      return true;
    }
  }
  return false;
}


let UtilFiles;

const Util = {
  getPages(toArray, addScript, filters) {
    const files = Util.getFileList();
    const entries = {},
      pagesPath = Config.get('pages'),
      plugins = [],
      comChunks = ['vendor'];
    let fname;
    for (let i = 0; i < files.length; i++) {
      fname = files[i];
      if (!checkFile(filters, fname)) continue;
      if (toArray) {
        entries[`${fname}/app`] = [path.resolve(cwd, `./${pagesPath}/${fname}/${Config.get('pageEntry')}`)];
      } else {
        entries[`${fname}/app`] = path.resolve(cwd, `./${pagesPath}/${fname}/${Config.get('pageEntry')}`);
      }
      const HtmlWebpackPlugin = require('html-webpack-plugin');
      plugins.push(new HtmlWebpackPlugin({
        filename: `${fname}/index.html`,
        template: path.resolve(cwd, `${pagesPath}/${fname}/index.html`),
        data: {
          lib: addScript ? `<script type="text/javascript" src="/${Config.get('gatherwork')}/${Config.get('dllLib')}.js"></script>` : '',
        },
        inject: 'body',
        chunks: comChunks.concat([`${fname}/app`]),
      }));
    }
    return {
      entries,
      plugins,
    };
  },
  getFileList() {
    if (UtilFiles) return UtilFiles;
    const pageDir = path.resolve(process.cwd(), Config.get('pages'));
    if (!fs.existsSync(pageDir)) {
      // throw new Error("can't find pages directory.");
      return [];
    }
    let files = fs.readdirSync(pageDir);
    if (!files || files.length === 0) {
      throw new Error("can't find any page");
    }
    files = files.filter(f => fs.existsSync(`${pageDir}/${f}/${Config.get('pageEntry')}`));
    if (files.length === 0) {
      throw new Error("can't find any page");
    }
    UtilFiles = files;
    return files;
  },
  getResolve(rev) {
    const resolve = Object.assign(Config.get('resolve'), rev);
    const files = Util.getFileList();
    let fname;
    for (let i = 0; i < files.length; i += 1) {
      fname = files[i];
      resolve[fname] = path.resolve(cwd, `${Config.get('pages')}/${fname}`);
    }
    return resolve;
  },
};

module.exports = Util;
