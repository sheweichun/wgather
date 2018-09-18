
const Constant = require('./constant');
const { Config } = require('wgather-core');

const Setting = Config('gather-dll.json', Constant.CWD, {
});


Setting.init();
module.exports = Setting;
