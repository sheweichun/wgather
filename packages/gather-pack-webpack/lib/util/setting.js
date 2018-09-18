
const Constant = require('./constant');
const { Config } = require('@ali/gather-core');

const Setting = Config('gather-dll.json', Constant.CWD, {
});


Setting.init();
module.exports = Setting;
