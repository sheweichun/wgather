
const path = require('path');
const fs = require('fs');
const Config = require('./config');
const Constant = require('./constant');

const cwd = Constant.CWD;
const merge = Object.assign;
function checkFile(projects, name) {
  if (!projects || projects.length === 0) return true;
  for (let j = 0; j < projects.length; j++) {
    if (new RegExp(projects[j]).test(name)) {
      return true;
    }
  }
  return false;
}

function getWorkerEntriesByDir(dirName) {
  const files = fs.readdirSync(dirName);
  if (!files || files.length === 0) {
    return [];
  }
  return files.filter(f => /worker\.js$/.test(f)).map(f => ({
    name: f,
    entryName: f.replace('.js', ''),
  }));
}

let UtilFiles;

const Util = {
  getPages(toArray, addScript, filters, isDev) {
    const configEntry = Config.get('entry');
    if (configEntry) {
      const plugins = [];
      const HtmlWebpackPlugin = require('html-webpack-plugin');
      const templateHtml = Config.get('templateHtml');
      if (templateHtml && isDev) {
        const templateOpt = merge({}, templateHtml, {
          isDev,
        });
        templateOpt.data = templateOpt.data || {};
        templateOpt.data.lib = addScript ? `<script type="text/javascript" src="/${Config.get('gatherwork')}/${Config.get('dllLib')}.js"></script>` : '';
        plugins.push(new HtmlWebpackPlugin(templateOpt));
      }
      return {
        entries: configEntry,
        plugins,
      };
    }
    const files = Util.getFileList();
    const entries = {},
      pagesPath = Config.get('pages'),
      plugins = [],
      comChunks = ['vendor'];
    let fname;
    const pageEntry = 'pageEntry';
    for (let i = 0; i < files.length; i++) {
      fname = files[i];
      if (!checkFile(filters, fname)) continue;
      if (isDev) {
        if (toArray) {
          entries[`${fname}/app`] = [path.resolve(cwd, `./${pagesPath}/${fname}/${Config.get(pageEntry)}`)];
        } else {
          entries[`${fname}/app`] = path.resolve(cwd, `./${pagesPath}/${fname}/${Config.get(pageEntry)}`);
        }
      } else {
        const entryDirName = path.resolve(cwd, pagesPath, fname);
        const workEntries = getWorkerEntriesByDir(entryDirName);
        // console.log('workEntries :',workEntries);
        if (workEntries && workEntries.length) {
          workEntries.forEach((entry) => {
            entries[`${fname}/${entry.entryName}`] = path.resolve(cwd, entryDirName, entry.name);
          });
        }
      }
      const templateName = path.resolve(cwd, `${pagesPath}/${fname}/index.html`);
      if (fs.existsSync(templateName) && isDev) {
        // console.log('templateName :', templateName, addScript, fname, entries);
        const HtmlWebpackPlugin = require('html-webpack-plugin');
        plugins.push(new HtmlWebpackPlugin({
          filename: `${fname}/index.html`,
          template: templateName,
          data: {
            lib: addScript ? `<script type="text/javascript" src="/${Config.get('gatherwork')}/${Config.get('dllLib')}.js"></script>` : '',
          },
          isDev,
          inject: 'body',
          chunks: comChunks.concat([`${fname}/app`]),
        }));
      }
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
      return [];
      // throw new Error("can't find pages directory.");
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
  getResolve(rev = {}) {
    const configEntry = Config.get('entry');
    const resolve = Object.assign(Config.get('resolve'), rev);
    if (configEntry) {
      return resolve;
    }
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
