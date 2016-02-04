var path = Npm.require('path');
var appModulePath = Npm.require('app-module-path');
appModulePath.addPath(process.cwd() + '/node_modules/');

var optionsFilePath = path.resolve(process.cwd(), 'package.json');
var fs = Npm.require('fs');
var cjson = Npm.require('cjson');

var corePlugins = {
	"postcss-modules-local-by-default": Npm.require("postcss-modules-local-by-default"),
	"postcss-modules-extract-imports": Npm.require("postcss-modules-extract-imports"),
	"postcss-modules-scope": Npm.require("postcss-modules-scope"),
	"postcss-modules-values": Npm.require("postcss-modules-values"),
};

corePlugins['postcss-modules-scope'].generateScopedName = function generateScopedName(exportedName, path) {
	let sanitisedPath = path.replace(/.*\{}[/\\]/, '').replace(/.*\{.*?}/, 'packages').replace(/\.[^\.\/\\]+$/, '').replace(/[\W_]+/g, '_').replace(/^_|_$/g, '');

	return `_${sanitisedPath}__${exportedName}`;
};

export default function loadPlugins() {
	var options = loadOptionsFromPackageFile();
	var plugins = [];

	R.forEach((pluginEntry)=> {
		var packageName = pluginEntry[0];
		var plugin = corePlugins[packageName] || Npm.require(packageName);
		if (plugin === undefined) throw new Error(`plugin ${packageName} was not found by NPM!`);

		plugins.push(applyPluginOptions(plugin, pluginEntry[1]));
	}, R.toPairs(options));
	return plugins;
}

function loadOptionsFromPackageFile() {
	var plugins;
	if (fs.existsSync(optionsFilePath))
	{
		var options = cjson.load(optionsFilePath).cssModules;
		if (options)
		plugins = options.plugins;
	}

	return plugins || {
			"postcss-modules-local-by-default": {},
			"postcss-modules-extract-imports": {},
			"postcss-modules-scope": {},
			"postcss-modules-values": {}
		}
}

function applyPluginOptions(plugin, options) {
	var combinedOptions = options.inlineOptions !== undefined ? options.inlineOptions : undefined;
	var fileOptions;
	if (R.type(options.fileOptions) === 'Array') {
		var getFilesAsJson = R.compose(R.reduce(deepExtend, {}), R.map(R.compose(loadJsonOrMssFile, decodeFilePath)));
		fileOptions = getFilesAsJson(options.fileOptions);
		if (Object.keys(fileOptions).length)
			combinedOptions = deepExtend(combinedOptions || {}, fileOptions || {});
	}

	return combinedOptions !== undefined ? plugin(combinedOptions) : plugin;
}

function loadJsonOrMssFile(filePath) {
	var removeLastOccurrence = (character, str)=> {
		var index = str.lastIndexOf(character);
		return str.substring(0, index) + str.substring(index + 1);
	};
	var loadMssFile = R.compose(variables=> ({variables: variables}), cjson.parse, str=>`{${str}}`, R.curry(removeLastOccurrence)(','), R.replace(/\$(.*):\s*(.*),/g, '"$1":"$2",'), R.replace(/;/g, ','), R.partialRight(fs.readFileSync, ['utf-8']));
	return filePath.endsWith(".mss") ? loadMssFile(filePath) : cjson.load(filePath);
}

function decodeFilePath(filePath) {
	const match = filePath.match(/{(.*)}\/(.*)$/);
	if (!match)
		return filePath;

	if (match[1] === '') return match[2];

	var paths = [];

	paths[1] = paths[0] = `packages/${match[1].replace(':', '_')}/${match[2]}`;
	if (!fs.existsSync(paths[0]))
		paths[2] = paths[0] = 'packages/' + match[1].replace(/.*:/, '') + '/' + match[2];
	if (!fs.existsSync(paths[0]))
		throw new Error(`Path not exist: ${filePath}\nTested path 1: ${paths[1]}\nTest path 2: ${paths[2]}`);

	return paths[0];
}

function deepExtend(destination, source) {
	for (var property in source) {
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
