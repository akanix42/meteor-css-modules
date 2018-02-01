/* globals Package */
Package.describe({
  name: 'nathantreid:css-modules',
  version: '3.2.0-beta.2',
  summary: 'CSS modules implementation. CSS for components!',
  git: 'https://github.com/nathantreid/meteor-css-modules.git',
  documentation: 'README.md'
});

Package.registerBuildPlugin({
  name: 'mss',
  use: [
    'babel-compiler@7.0.0',
    'ecmascript@0.10.0',
    'caching-compiler@1.1.7_1',
    'underscore@1.0.9',
  ],
  npmDependencies: {
    'app-module-path': '1.0.4',
    'camelcase': '3.0.0',
    'cjson': '0.3.3',
    'colors': '1.1.2',
    'common-tags': '1.3.1',
    'css-modules-loader-core': '1.0.0',
    'json-to-regex': '0.0.2',
    'es6-template-strings': '2.0.1',
    'hasha': '3.0.0',
    'lru-cache': '2.6.4',
    'path-is-absolute': '1.0.0',
    'postcss': '5.1.2',
    'postcss-modules-local-by-default': '1.1.1',
    'postcss-modules-extract-imports': '1.0.1',
    'postcss-modules-scope': '1.0.2',
    'postcss-modules-values': '1.2.2',
    'ramda': '0.19.0',
    'recursive-readdir': '1.3.0',
    'shorthash': '0.0.2',
    'string-template': '1.0.0',
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
  api.versionsFrom('1.6.1');
  api.use('isobuild:compiler-plugin@1.0.0');
  api.use([
    'ecmascript@0.10.0',
  ]);

  api.mainModule('package/main.js');
});
