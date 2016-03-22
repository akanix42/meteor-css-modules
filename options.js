const path = Npm.require('path');
const fs = Npm.require('fs');
const cjson = Npm.require('cjson');
const optionsFilePath = path.resolve(process.cwd(), 'package.json');

let options;
if (fs.existsSync(optionsFilePath))
	options = cjson.load(optionsFilePath).cssModules;

options = processGlobalVariables(options);
options = R.merge(getDefaultOptions(), options || {});

export default options;

function getDefaultOptions() {
	return {
		explicitIncludes: [],
		extensions: ['mss'],
		outputJsFilePath: '{dirname}/{basename}{extname}',
		outputCssFilePath: '{dirname}/{basename}',
		globalVariablesText: '',
		enableSassCompilation: ['scss', 'sass']
	};
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
				if (path.extname() === '.json') {
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
