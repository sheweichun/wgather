const Logger = require('./logger');

let startTimeStamp;

module.exports = {
  start() {
    startTimeStamp = Date.now();
  },
  record(title) {
    Logger.warn(`【${title}】runed ${Date.now() - startTimeStamp}ms`);
  },
};
