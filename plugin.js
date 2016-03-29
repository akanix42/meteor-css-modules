import pluginOptions from './options';
import CssModulesBuildPlugin from './css-modules-build-plugin';

ImportPathHelpers.init(Plugin);

Plugin.registerCompiler({
	extensions: pluginOptions.extensions,
	archMatching: pluginOptions.specificArchitecture
}, function () {
	return new CssModulesBuildPlugin(Plugin);
});
