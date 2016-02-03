ImportPathHelpers.init(Plugin);

Plugin.registerCompiler({
	extensions: ["js"]
}, function () {
	return new JsCompiler();
});

Plugin.registerCompiler({
	extensions: ["jsx"]
}, function () {
	return new JsCompiler({
		react: true
	});
});

Plugin.registerCompiler({
	extensions: ["mss"],
	archMatching: 'web'
}, function () {
	return new CssModulesBuildPlugin(Plugin);
});
