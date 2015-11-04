ImportPathHelpers.init(Plugin);

Plugin.registerCompiler({
	extensions: ["js"]
}, function () {
	return new JsCompiler();
});

Plugin.registerCompiler({
	extensions: ["mss"],
	archMatching: 'web'
}, function () {
	return new CssModulesCompiler();
});
