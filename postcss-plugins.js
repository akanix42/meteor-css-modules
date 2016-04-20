import pluginOptionsWrapper from './options';
const pluginOptions = pluginOptionsWrapper.options;
const fs = Npm.require('fs');
const cjson = Npm.require('cjson');
const path = Npm.require('path');
const appModulePath = Npm.require('app-module-path');
appModulePath.addPath(ImportPathHelpers.basePath + '/node_modules/');

const corePlugins = {
	"postcss-modules-local-by-default": Npm.require("postcss-modules-local-by-default"),
	"postcss-modules-extract-imports": Npm.require("postcss-modules-extract-imports"),
	"postcss-modules-scope": Npm.require("postcss-modules-scope"),
	"postcss-modules-values": Npm.require("postcss-modules-values"),
};

corePlugins['postcss-modules-scope'].generateScopedName = function generateScopedName(exportedName, filePath) {
	let sanitisedPath = path.relative(ImportPathHelpers.basePath, filePath).replace(/.*\{}[/\\]/, '').replace(/.*\{.*?}/, 'packages').replace(/\.[^\.\/\\]+$/, '').replace(/[\W_]+/g, '_').replace(/^_|_$/g, '');
	const filename = path.basename(filePath).replace(/\.[^\.\/\\]+$/, '').replace(/[\W_]+/g, '_').replace(/^_|_$/g, '');
	sanitisedPath = sanitisedPath.replace(new RegExp(`_(${filename})$`), '__$1');
	return `_${sanitisedPath}__${exportedName}`;
};

export default loadPlugins();

function loadPlugins() {
	const options = pluginOptions.postcssPlugins || {
			"postcss-modules-local-by-default": {},
			"postcss-modules-extract-imports": {},
			"postcss-modules-scope": {},
			"postcss-modules-values": {}
		};
	const plugins = [];

	R.forEach((pluginEntry)=> {
		const packageName = pluginEntry[0];
		let plugin = corePlugins[packageName] || Npm.require(packageName);
		if (plugin === undefined) throw new Error(`plugin ${packageName} was not found by NPM!`);

		var pluginEntryOptions = getPluginOptions(pluginEntry[1]);
		if (options.globalVariablesJs && packageName === 'postcss-simple-vars')
			pluginEntryOptions = R.merge({variables: options.globalVariablesJs}, pluginEntryOptions);

		plugin = pluginEntryOptions !== undefined ? plugin(pluginEntryOptions) : plugin;
		plugins.push(plugin);
	}, R.toPairs(options));
	return plugins;
}

function getPluginOptions(pluginEntry) {
	let combinedOptions = pluginEntry.inlineOptions !== undefined ? pluginEntry.inlineOptions : undefined;
	let fileOptions;
	if (R.type(pluginEntry.fileOptions) === 'Array') {
		const getFilesAsJson = R.compose(R.reduce(deepExtend, {}), R.map(R.compose(loadJsonOrMssFile, decodeFilePath)));
		fileOptions = getFilesAsJson(pluginEntry.fileOptions);
		if (Object.keys(fileOptions).length)
			combinedOptions = deepExtend(combinedOptions || {}, fileOptions || {});
	}
	return combinedOptions;
}

function loadJsonOrMssFile(filePath) {
	const removeLastOccurrence = (character, str)=> {
		const index = str.lastIndexOf(character);
		return str.substring(0, index) + str.substring(index + 1);
	};
	const loadMssFile = R.compose(variables=> ({variables: variables}), cjson.parse, str=>`{${str}}`, R.curry(removeLastOccurrence)(','), R.replace(/\$(.*):\s*(.*),/g, '"$1":"$2",'), R.replace(/;/g, ','), R.partialRight(fs.readFileSync, ['utf-8']));
	return filePath.endsWith(".json") ? cjson.load(filePath) : loadMssFile(filePath);
}

function decodeFilePath(filePath) {
	const match = filePath.match(/{(.*)}\/(.*)$/);
	if (!match)
		return filePath;

	if (match[1] === '') return match[2];

	const paths = [];

	paths[1] = paths[0] = `packages/${match[1].replace(':', '_')}/${match[2]}`;
	if (!fs.existsSync(paths[0]))
		paths[2] = paths[0] = 'packages/' + match[1].replace(/.*:/, '') + '/' + match[2];
	if (!fs.existsSync(paths[0]))
		throw new Error(`Path not exist: ${filePath}\nTested path 1: ${paths[1]}\nTest path 2: ${paths[2]}`);

	return paths[0];
}

function deepExtend(destination, source) {
	for (let property in source) {
		if (source[property] && source[property].constructor &&
			source[property].constructor === Object) {
			destination[property] = destination[property] || {};
			arguments.callee(destination[property], source[property]);
		} else {
			destination[property] = source[property];
		}
	}
	return destination;
}
