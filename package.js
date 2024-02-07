/* globals Package */
Package.describe({
  name: 'nathantreid:css-modules',
  version: '5.0.0',
  summary: 'CSS modules implementation. CSS for components!',
  git: 'https://github.com/nathantreid/meteor-css-modules.git',
  documentation: 'README.md'
});

Package.registerBuildPlugin({
  name: 'mss',
  use: [
    'babel-compiler',
    'ecmascript',
    'caching-compiler',
    'underscore',
  ],
  npmDependencies: {
    "app-module-path": "2.2.0",
    "camelcase": "8.0.0",
    "cjson": "0.5.0",
    "colors": "1.4.0",
    "common-tags": "1.8.2",
    "css-modules-loader-core": "1.1.0",
    "lru-cache": "4.0.1",
    "path-is-absolute": "1.0.1",
    "postcss": "8.4.32",
    "postcss-modules-extract-imports": "3.0.0",
    "postcss-modules-local-by-default": "4.0.3",
    "postcss-modules-scope": "3.0.0",
    "postcss-modules-values": "4.0.0",
    "recursive-readdir": "2.2.3",
    "semver": "7.5.4",
    "string-template": "1.0.0",

    'json-to-regex': '0.0.2',
    'es6-template-strings': '2.0.1',
    'hasha': '3.0.0',
    'ramda': '0.19.0',
    'shorthash': '0.0.2',
  },
  sources: [
    'sha1.js',
    'logger.js',
    'text-replacer.js',
    'included-file.js',
    'get-output-path.js',
    'check-npm-package.js',
    'options.js',
    'helpers/import-path-helpers.js',
    'helpers/profile.js',
    'postcss-plugins.js',
    'scss-processor.js',
    'less-processor.js',
    'stylus-processor.js',
    'css-modules-processor.js',
    'css-modules-build-plugin.js',
    'plugin.js'
  ]
});

Package.onUse(function (api) {
  // api.versionsFrom('1.6.1');
  api.use('isobuild:compiler-plugin@1.0.0');
  api.use([
    'ecmascript',
  ]);

  api.mainModule('package/main.js');
});
