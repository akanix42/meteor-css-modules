const path = Npm.require('path');
const fs = Npm.require('fs');
const cjson = Npm.require('cjson');
const optionsFilePath = path.resolve(process.cwd(), 'package.json');

let options;
if (fs.existsSync(optionsFilePath))
	options = cjson.load(optionsFilePath).cssModules;
options = R.merge(getDefaultOptions(), options || {});

export default options;

function getDefaultOptions() {
	return {
		extensions: ['mss'],
		outputJsFilePath: '{dirname}/{basename}{extname}',
		outputCssFilePath: '{dirname}/{basename}',

	};
}
