// This file is required in mocha.opts
// The only purpose of this file is to ensure
// the babel transpiler is activated prior to any
// test code, and using the same babel options
require('babel-register')({
  presets: [
    'es2015'
  ],
  plugins: [
    'transform-object-rest-spread',
    'transform-es2015-destructuring',
    'syntax-async-functions',
    'syntax-async-generators',
    'transform-regenerator',
    // 'babel-project-relative-import',
    // {
    //   'importPathPrefix': '/'
    // },

  ]
})

require('babel-polyfill')

require('./import-path-helpers.stub');
