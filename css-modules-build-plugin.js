import loadPlugins from './plugins-loader';


CssModulesBuildPlugin = class CssModulesBuildPlugin {
	processFilesForTarget(files) {
		var processor = new CssModulesProcessor('./', loadPlugins());
		processFiles(files, processor);
	}
};


function processFiles(files, processor) {
	const allFiles = createAllFilesMap(files);
	files.forEach(processFile.bind(this));

	function processFile(file) {
		var source = {
			path: ImportPathHelpers.getImportPathInPackage(file),
			contents: file.getContentsAsBuffer().toString('utf8')
		};
		return processor.process(source, './', allFiles)
			.then((result)=> {
				file.addStylesheet({
					data: result.source,
					path: file.getPathInPackage().replace('\.mss$', '.css'),
					sourceMap: JSON.stringify(result.sourceMap)
				});

				file.addJavaScript({
					data: Babel.compile('' +
						`var styles = ${JSON.stringify(result.tokens)};\n` +
						'export { styles as default, styles };').code,
					path: file.getPathInPackage() + '.js'
				});
			}).await();
	}
}

function createAllFilesMap(files) {
	var allFiles = new Map();
	files.forEach((inputFile) => {
		const importPath = ImportPathHelpers.getImportPathInPackage(inputFile);
		allFiles.set(importPath, inputFile);
	});
	return allFiles;
}
