Package.describe({
	name: 'nathantreid:css-modules',
	version: '1.0.0-beta.5',
	// Brief, one-line summary of the package.
	summary: 'CSS modules implementation. CSS for components!',
	// URL to the Git repository containing the source code for this package.
	git: 'https://github.com/nathantreid/meteor-css-modules.git',
	// By default, Meteor will default to using README.md for documentation.
	// To avoid submitting documentation, set this field to null.
	documentation: 'README.md'
});


Package.registerBuildPlugin({
	name: 'css-modules-build-plugin',
	use: [
		'babel-compiler@6.4.0-modules.5',
		'ecmascript@0.4.0-modules.5',
		'nathantreid:css-modules-import-path-helpers@0.0.1',
		'ramda:ramda@0.19.0',
	],
	npmDependencies: {
		"app-module-path": "1.0.4",
		"cjson": "0.3.3",
		"css-modules-loader-core": "1.0.0",
		"postcss": "5.0.14",
		"postcss-modules-local-by-default": "1.0.1",
		"postcss-modules-extract-imports": "1.0.0",
		"postcss-modules-scope": "1.0.0",
		"postcss-modules-values": "1.1.1",
	},
	sources: [
		'plugins-loader.js',
		'css-modules-processor.js',
		'css-modules-build-plugin.js',
		'plugins.js'
	]
});

Package.onUse(function (api) {
	api.use('isobuild:compiler-plugin@1.0.0');

});
