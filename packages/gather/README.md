# Gather

Gather聚焦于提供项目快速升级打包依赖的问题，让开发者项目跟具体的资源打包工具脱离，从而达到与打包工具的解耦合，这样做的好处就是未来资源打包工具升级或者替换，对开发者都是透明，统一在Gather这一层去升级或者更换


## 安装
全局安装@ali/gather

```shell
tnpm i @ali/gather -g
```


## 快速开始

所有要使用gather的项目必须在根目录下配置一个gather.conf.js文件，默认导出一个json对象,如下
```javascript
module.exports = {
  packName:'webpack',
  packVersion:'0.0.2',
  packOption:{
  },
  config:{
  },
  plugins:[]
}

```


## 命令行
目前提供了dev,build和config

### 开发

```shell
gather dev

```
具体可用参数如下

```shell
  .option('-c --config <configfile>', 'config file', val => val.split(','))
  .option('-t --port <port>', 'server port')
  .option('-v --visual', 'Visualize build stat')
  .option('-e --entries <pages>', 'Develop Entries', val => val.split(','))
```



### 打包
```shell
gather build
```
具体可用参数如下
```shell
  .option('-c --config <configfile>', 'config file', val => val.split(','))
  .option('-n --nominify', 'not to Uglify code')
  .option('-v --visual', 'Visualize build stat')
  .option('-e --entries <pages>', 'Build Entries', val => val.split(','))
```


### 查看gather配置
```shell
gather config [get|set] [value]
```


## 套件机制

Gather提供了套件机制，开发者可以开发自己的专属套件，所谓套件就是资源打包逻辑模块，套件配置如下

```javascript
{
  packName:'webpack',  //套件包名为@ali/gather-pack-webpack
  packVersion:'0.0.2',  // 要使用的套件版本,默认为空,使用最新的
  packVersionCheck:'a',  // 套件更新策略,可选值为a,b,c
  packOption:{
      ...  //会传入@ali/gather-pack-webpack的参数
  },
}
```

### 套件更新策略
    
* 如果未指定packVersion，则默认使用最新的版本,一旦有新的版本就会提示用户去更新
* 如果指定了packVersion为a.b.c,
    * 当packVersionCheck为空时，则有新版本就更新
    * 当packVersionCheck为'a'时，则只会更新到a.x.x版本
    * 当packVersionCheck为'b'时，则只会更新到a.b.x版本
    * 当packVersionCheck为'c'时，则不会更新
