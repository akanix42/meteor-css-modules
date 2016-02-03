Package.describe({
	name: 'nathantreid:css-modules',
	version: '1.0.0-beta.2',
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
		'nathantreid:css-modules-js-compiler@1.0.0-beta.2',
		'nathantreid:css-modules-mss-compiler@1.0.0-beta.1'
	],
	sources: [
		'plugins.js'
	]
});

Package.onUse(function (api) {
	api.use('isobuild:compiler-plugin@1.0.0');

	api.imply('modules@0.5.0-modules.5');
	api.imply('ecmascript-runtime@0.2.7-modules.5');
	api.imply('babel-runtime@0.1.5-modules.5');
	api.imply('promise@0.5.2-modules.5');

	api.export('ECMAScript');

});
