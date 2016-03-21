const path = Npm.require('path');
const format = Npm.require('string-template');

export default function getOutputPath(filePath, template) {
	const extname = path.extname(filePath);
//console.log(filePath)
//	console.log(template)
//	console.log(format(template, {
//		dirname: path.dirname(filePath),
//		basename: path.basename(filePath, extname),
//		extname
//	}))
//	console.log('####################\n')
	return format(template, {
		dirname: path.dirname(filePath),
		basename: path.basename(filePath, extname),
		extname
	});
}
