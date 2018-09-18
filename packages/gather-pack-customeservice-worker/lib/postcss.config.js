
const Config = require('./util/config');

module.exports = {
  plugins: [
    require('autoprefixer')(Config.get('autoprefixer')),
  ].concat(Config.get('otherPostCss') || []),
};
