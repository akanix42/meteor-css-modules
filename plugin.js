import CssModulesBuildPlugin from './css-modules-build-plugin';
import pluginOptionsWrapper from './options';

const pluginOptions = pluginOptionsWrapper.options;

ImportPathHelpers.init(Plugin);

if (pluginOptions.extensions.indexOf('css') === -1)
	registerCompiler();
else
	monkeyPatchToHandleCssExtension();


function registerCompiler() {
	Plugin.registerCompiler({
		extensions: pluginOptions.extensions,
		archMatching: pluginOptions.specificArchitecture,
		filenames: pluginOptions.filenames
	}, function () {
		return new CssModulesBuildPlugin(Plugin);
	});
}

/**
 * Monkey patch _registerSourceProcessor and SourceProcessorSet.merge so we can block the default CSS compiler
 */
function monkeyPatchToHandleCssExtension() {
	const registerSourceProcessor = Plugin._registerSourceProcessor;
	Plugin._registerSourceProcessor = function (options, factory, {sourceProcessorSet, methodName, featurePackage}) {
		const buildPluginMerge = sourceProcessorSet.constructor.prototype.merge;
		sourceProcessorSet.constructor.prototype.merge = function (otherSet, options) {
			/**
			 * If a css plugin handler has already been added,
			 * don't merge the meteor package, which only includes the 'css' package
			 */
			if (otherSet._myPackageDisplayName !== 'meteor' || !('css' in this._byExtension)) {
				buildPluginMerge.call(this, ...arguments);
				return;
			}
		};
		registerSourceProcessor(options, factory, {sourceProcessorSet, methodName, featurePackage});
	};

	registerCompiler();

	Plugin._registerSourceProcessor = registerSourceProcessor;
}
