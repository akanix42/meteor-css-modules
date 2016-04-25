import CssModulesBuildPlugin from './css-modules-build-plugin';
import pluginOptionsWrapper from './options';
import { Hot } from 'meteor/gadicc:hot-build';

const pluginOptions = pluginOptionsWrapper.options;
const hot = new Hot('nathantreid:css-modules/mss');

ImportPathHelpers.init(Plugin);

Plugin.registerCompiler({
	extensions: pluginOptions.extensions,
	archMatching: pluginOptions.specificArchitecture
}, function () {
	return hot.wrap(new CssModulesBuildPlugin(Plugin));
});
