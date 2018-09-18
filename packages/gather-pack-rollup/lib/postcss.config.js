
const Config = require('./util/config');

module.exports = {
  plugins: [
    require('autoprefixer')(Config.get('autoprefixer')),
  ],
};
