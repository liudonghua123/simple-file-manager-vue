const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
  runtimeCompiler: true,
  // https://cli.vuejs.org/zh/config/#publicpath
  publicPath: './',
  // https://github.com/FE-Mars/monaco-editor-vue
  chainWebpack: config => {
    config.plugin('monaco-editor').use(MonacoWebpackPlugin, [
      {
        // Languages are loaded on demand at runtime
        languages: ['json', 'javascript', 'html', 'xml'],
      },
    ]);
  },
};
