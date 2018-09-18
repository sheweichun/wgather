# gather-pack-webpack
 该套件应用于由fie init bdf生成的项目，开发者也可以通过修改config配置来适应各种项目适配


## 安装
无需开发者手动安装，在pack配置设置，gather会自动接管


## pack配置
  gather.conf.js中对应的packOption,如下都是默认值

```javascript
{
    dll: false,  //是否启用DllPlugin,会读取package.json中的dependencies
    notdll: [],  //排除dependencies中一些包
    modules: false, //是否启用css module
    happypack: false, //是否启用happypack
    less: false, //是否需要less
    autoInstall : true //是否自动安装依赖
    sass: false, //是否需要sass
    config:{} //见下面的config配置
}
```

## config配置
  如下都是默认值

```javascript
{
  pages: 'src/pages',  //默认搜索入口目录
  pageEntry: 'app.js',  //每一个目录中默认的入口文件
  // entry:{},   //单文件开发的配置
  dest: 'build',    //编译后输出的目录
  gatherwork: '.gather',   //gather在项目中会使用的文件夹
  dllLib: 'gatherLib',   //开发模式生成的dll的名字
  dllVendor: 'gatherVendor', //生产模式生成的dll的名字
  analyzerOpt: {},  //webpack-bundle-analyzer插件的配置项
  contentBase: [],  //开发模式的静态目录配置
  autoprefixer: {},  //autoprefixer的默认配置
  babel: {   //babel的默认配置
    babelrc: false,
    presets: ['react', ['es2015', { modules: false }], 'stage-0'],
    plugins: [
      'transform-decorators-legacy',
      [
        'next',
        {
          jsName: '@alife/next',
          cssName: '@alife/next',
          dir: 'lib',
          noStyle: true,
        },
      ],
    ],
    env: {
      development: {
        presets: ['react-hmre'],
      },
    },
  },
  localIdentName: '[name][local]-[hash:base64:5]', //css module的默认配置
  uglyOpt: {  //webpack.optimize.UglifyJsPlugin的配置 
    compress: {
      unused: true,
      dead_code: true,
      warnings: false,
    },
    mangle: {
      except: ['$', 'exports', 'require'],
    },
    output: {
      ascii_only: true,
    },
  },
  resolve: {  //webpack的resolve中的alias配置
    util: realPath('src/util'),
    styles: realPath('src/less'),
    commons: realPath('src/components'),
    mixins: realPath('src/mixins'),
    actions: realPath('src/pages/isv/actions'),
    api: realPath('src/pages/isv/api'),
  }
}

```
