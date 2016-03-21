import pluginOptions from './options';
import CssModulesBuildPlugin from './css-modules-build-plugin';

ImportPathHelpers.init(Plugin);

console.log('\n\n\n#############################');
console.log('extensions');
console.log(JSON.stringify(pluginOptions.extensions));

Plugin.registerCompiler({
	extensions: pluginOptions.extensions,
	archMatching: 'web'
}, function () {
	return new CssModulesBuildPlugin(Plugin);
});
//
//console.log('\n\n\n\n\$$$$$$$$$$$$$$$$$$$')
//console.log(Plugin.pluginInfo)
//console.log('....')
//console.log(Plugin)
//console.log('\n\n\n\n\$$$$$$$$$$$$$$$$$$$')

//function Test() {}
//Test.prototype.processFilesForBundle = function (files, options) {
//	console.log('files')
//	console.log(files.map(file=>file.getPathInBundle()));
//};
//Plugin.registerMinifier({
//	extensions: ['css'],
//	archMatching: 'web'
//}, function () {
//	return new Test();
//});
