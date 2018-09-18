
// const path = require('path');
// const fs = require('fs');
const { Packer, Logger } = require('@ali/gather-core');
const Constant = require('./util/constant');
const webpack = require('webpack');
const Base = require('./base');
// const Dll = require('./dll');

const Config = require('./util/config');

module.exports = class WebPackPacker extends Packer {
  constructor(gather) {
    super(gather);
    this.checkList = Base.checkList;
    if (this.gather.packOption.dll) {
      this.gather.pluginList.push(DllPlugin);
    }
  }
  getBuildConfig() {
    const { nominify, visual, entries } = this.gather.option;
    
  }
  build(config) {
    
  }
  getDevConfig() {

    return Promise.resolve({});
  }

  dev(config) {
    
  }
}
;
