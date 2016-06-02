import CssModulesBuildPlugin from './css-modules-build-plugin';
import pluginOptionsWrapper from './options';

const pluginOptions = pluginOptionsWrapper.options;

ImportPathHelpers.init(Plugin);

Plugin.registerCompiler({
	extensions: pluginOptions.extensions,
	archMatching: pluginOptions.specificArchitecture,
	filenames: pluginOptions.filenames
}, function () {
	return new CssModulesBuildPlugin(Plugin);
});
