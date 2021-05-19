const babelConfigFactory = require('hzero-cli/lib/babelConfigFactory');

const config = babelConfigFactory();

// config.plugins.push([
  // "module-resolver", {
  //     "root": ["./"],
  //     "alias": {
  //     '@': './src',
  //     components: './src/components',
  //     utils: './src/utils',
  //     services: './src/services',
  //     }
  //   }
// ]);

module.exports = config;
