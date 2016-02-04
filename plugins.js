ImportPathHelpers.init(Plugin);

Plugin.registerCompiler({
	extensions: ["mss"],
	archMatching: 'web'
}, function () {
	return new CssModulesBuildPlugin(Plugin);
});
