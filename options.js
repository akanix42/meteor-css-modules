import { R } from 'meteor/ramda:ramda';
import checkNpmPackage from './check-npm-package';

import appModulePath from 'app-module-path';
appModulePath.addPath(ImportPathHelpers.basePath + '/node_modules/');

const path = Npm.require('path');
const fs = Npm.require('fs');
const cjson = Npm.require('cjson');
const optionsFilePath = path.resolve(process.cwd(), 'package.json');

const pluginOptions = {};
loadOptions();
export { loadOptions as reloadOptions };
export default pluginOptions;

function getDefaultOptions() {
	return {
		tokens: {
			camelCase: true
		},
		enableProfiling: false,
		enableSassCompilation: ['scss', 'sass'],
		enableStylusCompilation: ['styl', 'm.styl'],
		explicitIncludes: [],
		ignorePaths: [],
		extensions: ['css', 'm.css', 'mss'],
		filenames: [],
		globalVariablesText: '',
		outputJsFilePath: '{dirname}/{basename}{extname}',
		outputCssFilePath: '{dirname}/{basename}{extname}',
		passthroughPaths: [],
		specificArchitecture: 'web'
	};
}

function loadOptions() {
	let options = null;
	if (fs.existsSync(optionsFilePath))
		options = cjson.load(optionsFilePath).cssModules;

	options = options || {};
	options = processGlobalVariables(options);
	options = R.merge(getDefaultOptions(), options || {});

	checkSassCompilation(options);
	checkStylusCompilation(options);

	return pluginOptions.options = options;
}

function checkSassCompilation(options) {
	if (!options.enableSassCompilation)
		return;

	if (options.enableSassCompilation === true
		|| (Array.isArray(options.enableSassCompilation) && R.intersection(options.enableSassCompilation, options.extensions).length)) {
		const result = checkNpmPackage('node-sass@3.x');
		if (result === true)
			return;

		options.enableSassCompilation = false;
	}
}

function checkStylusCompilation(options) {
	if (!options.enableStylusCompilation)
		return;

	if (options.enableStylusCompilation === true
		|| (Array.isArray(options.enableStylusCompilation) && R.intersection(options.enableStylusCompilation, options.extensions).length)) {
		const result = checkNpmPackage('stylus@0.x');
		if (result === true)
			return;

		options.enableStylusCompilation = false;
	}
}

function processGlobalVariables(options) {
	if (!options.globalVariables)
		return options;

	const globalVariablesText = [];
	const globalVariablesJs = [];
	options.globalVariables.forEach(entry=> {
		switch (R.type(entry)) {
			case 'Object':
				globalVariablesJs.push(entry);
				globalVariablesText.push(convertJsonVariablesToScssVariables(entry));
				break;
			case 'String':
				const fileContents = fs.readFileSync(entry, 'utf-8');
				if (path.extname(entry) === '.json') {
					const jsonVariables = cjson.parse(fileContents);
					globalVariablesJs.push(jsonVariables);
					globalVariablesText.push(convertJsonVariablesToScssVariables(jsonVariables));
				} else {
					globalVariablesJs.push(convertScssVariablesToJsonVariables(fileContents));
					globalVariablesText.push(fileContents);
				}
				break;
		}
	});
	options.globalVariablesJs = R.mergeAll(globalVariablesJs);
	options.globalVariablesText = R.join('\n', globalVariablesText);
	options.globalVariablesTextLineCount = options.globalVariablesText.split(/\r\n|\r|\n/).length;

	return options;

	function convertJsonVariablesToScssVariables(variables) {
		const convertObjectToKeyValueArray = R.toPairs;
		const convertVariablesToScss = R.reduce((variables, pair) => variables + `$${pair[0]}: ${pair[1]};\n`, '');
		const processVariables = R.pipe(convertObjectToKeyValueArray, convertVariablesToScss);
		return processVariables(variables);
	}

	function convertScssVariablesToJsonVariables(text) {
		const extractVariables = R.match(/^\$.*/gm);
		const convertVariableToJson = R.replace(/\$(.*):\s*(.*);/g, '"$1":"$2"');
		const surroundWithBraces = (str) => `{${str}}`;

		const processText = R.pipe(extractVariables, R.map(convertVariableToJson), R.join(',\n'), surroundWithBraces, cjson.parse);
		return processText(text);
	}
}
