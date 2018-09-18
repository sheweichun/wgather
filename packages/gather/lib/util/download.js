
const Config = require('./config');
const Logger = require('./logger');
// const fs = require('fs');
// const path = require('path');

module.exports = {
  downloadProjectFromGitlab(output, name, tag) {
    const request = require('request');
    const unzip = require('unzip-stream');
    const Writer = require('fstream').Writer;
    let flag = false;
    let entryIndex = 0;
    return new Promise((resolve, reject) => {
      // const fileName = `${output}.zip`;
      // const stream = fs.createWriteStream(fileName);
      // console.log('url :', `http://gitlab.alibaba-inc.com/gather/${name}/repository/archive.zip?ref=${tag}`);
      Logger.log(`正在下载${name}-${tag}.zip`);
      request(`http://github.com/sheweichun/${name}/repository/archive.zip?ref=${tag}&private_token=${Config.get('gitlab_token')}`)
        // .pipe(stream)
        // .pipe(unzip.Extract({ path: output }))
        .pipe(unzip.Parse())
        .on('entry', (entry) => {
          if (!flag) {
            Logger.success(`下载${name}-${tag}.zip成功,准备解压...`);
            flag = true;
          }
          const fileName = entry.path;
          if (entry.isDirectory) return;
          entryIndex += 1;
          entry.pipe(Writer(fileName.replace(new RegExp(`.*${tag}.*?/`), `${output}/`)))
          // entry.pipe(Writer(fileName.replace(/.*?\//, `${output}/`)))
          .on('close', () => {
            entryIndex -= 1;
            if (entryIndex === 0) {
              Logger.success('解压成功！');
              resolve(output);
            }
          });
        })
        .on('error', reject)
        .on('close', () => {

        });
    });
  },
  // upzip(src, dest) {
  //   return new Promise((resolve, reject) => {
  //     const unzip = require('unzip-stream');
  //     fs.createReadStream(`${src}.zip`)
  //     .pipe(unzip.Extract({ path: dest || src }))
  //     .on('error', reject)
  //     .on('close', () => {
  //       resolve(dest);
  //     });
  //   });
  // },
}
;
