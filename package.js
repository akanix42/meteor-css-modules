Package.describe({
	name: 'nathantreid:css-modules',
	version: '2.2.1',
	summary: 'CSS modules implementation. CSS for components!',
	git: 'https://github.com/nathantreid/meteor-css-modules.git',
	documentation: 'README.md'
});


Package.registerBuildPlugin({
	name: 'mss',
	use: [
		'babel-compiler@6.8.2',
		'ecmascript@0.4.5',
		'caching-compiler@1.0.5',
		'nathantreid:css-modules-import-path-helpers@0.1.4',
		'ramda:ramda@0.19.0',
		'underscore@1.0.7',
	],
	npmDependencies: {
		"app-module-path": "1.0.4",
		"camelcase": "3.0.0",
		"cjson": "0.3.3",
		"colors": "1.1.2",
		"css-modules-loader-core": "1.0.0",
		"lru-cache": "2.6.4",
		"postcss": "5.0.14",
		"postcss-modules-local-by-default": "1.0.1",
		"postcss-modules-extract-imports": "1.0.0",
		"postcss-modules-scope": "1.0.0",
		"postcss-modules-values": "1.1.1",
		"recursive-readdir": "1.3.0",
		"string-template": "1.0.0",
	},
	sources: [
		'sha1.js',
		'text-replacer.js',
		'included-file.js',
		'get-output-path.js',
		'check-npm-package.js',
		'options.js',
		'helpers/profile.js',
		'postcss-plugins.js',
		'scss-processor.js',
		'stylus-processor.js',
		'css-modules-processor.js',
		'css-modules-build-plugin.js',
		'plugin.js'
	]
});

Package.onUse(function (api) {
	api.versionsFrom('1.3.3.1');
	api.use('isobuild:compiler-plugin@1.0.0');
});
