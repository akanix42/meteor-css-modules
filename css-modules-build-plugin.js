import path from 'path';
import Future from 'fibers/future';
import ScssProcessor from './scss-processor';
import CssModulesProcessor from './css-modules-processor';
import IncludedFile from './included-file';
import pluginOptions from './options';
import plugins from './postcss-plugins';
import getOutputPath from './get-output-path';
const recursive = Npm.require('recursive-readdir');
//import recursive from 'recursive-readdir';

// clock function thanks to NextLocal: http://stackoverflow.com/a/34970550/1090626
function clock(start) {
	if (!start) return process.hrtime();
	var end = process.hrtime(start);
	return Math.round((end[0] * 1000) + (end[1] / 1000000));
}

function profile(start, message) {
	if (!pluginOptions.enableProfiling)
		return;

	const time = clock(start);
	if (start !== undefined)
		console.log(message, time, 'ms');

	return time;
}

export default class CssModulesBuildPlugin {
	processFilesForTarget(files) {
		const start = profile();
		files = addFilesFromIncludedFolders(files);
		const allFiles = createAllFilesMap(files);

		if (pluginOptions.enableSassCompilation)
			compileScssFiles.call(this, files);
		compileCssModules.call(this, files);

		profile(start, 'compilation complete in ');

		function addFilesFromIncludedFolders(files) {
			pluginOptions.explicitIncludes.map(folderPath=> {
				const recursiveFuture = new Future();
				recursive(folderPath, [onlyAllowExtensionsHandledByPlugin], function (err, includedFiles) {
					if (err)
						recursiveFuture.throw(err);
					if (includedFiles)
						files = files.concat(includedFiles.map(filePath=>new IncludedFile(filePath.replace(/\\/g, '/'), files[0])));
					recursiveFuture.return();
				});

				function onlyAllowExtensionsHandledByPlugin(file, stats) {
					let extension = path.extname(file);
					if (extension)
						extension = extension.substring(1);
					return !stats.isDirectory() && pluginOptions.extensions.indexOf(extension) === -1;
				}

				recursiveFuture.wait();
			});
			return files;
		}

		function compileScssFiles(files) {
			const processor = new ScssProcessor('./', allFiles);
			const isScssRoot = (file)=>isScss(file) && isRoot(file);
			const compileFile = compileScssFile.bind(this);
			files.filter(isScssRoot).forEach(compileFile);

			function isScss(file) {
				if (pluginOptions.enableSassCompilation === true)
					return true;

				const extension = path.extname(file.getPathInPackage()).substring(1);
				return pluginOptions.enableSassCompilation.indexOf(extension) !== -1;
			}

			function isRoot(inputFile) {
				const fileOptions = inputFile.getFileOptions();
				if (fileOptions.hasOwnProperty('isImport')) {
					return !fileOptions.isImport;
				}
				return !hasUnderscore(inputFile.getPathInPackage());
			}

			function compileScssFile(file) {
				const contents = file.contents = file.getContentsAsString();
				file.contents = `${pluginOptions.globalVariablesText}\n\n${contents || ''}`;

				file.getContentsAsString = function getContentsAsStringWithGlobalVariables() {
					return file.contents;
				};

				const source = {
					path: ImportPathHelpers.getImportPathInPackage(file),
					contents: file.getContentsAsString(),
					file
				};

				let result;
				try {
					result = processor.process(file, source, './', allFiles);
				} catch (err) {
					file.error({
						message: `CSS modules SCSS compiler error: ${JSON.stringify(err, Object.getOwnPropertyNames(err))}\n`,
						sourcePath: file.getDisplayPath()
					});
					return null;
				}

				file.getContentsAsString = function getContentsAsString() {
					return result.source;
				};
			}
		}

		function compileCssModules(files) {
			const processor = new CssModulesProcessor('./');
			const compileFile = processFile.bind(this);
			const isNotScssImport = (file) => !hasUnderscore(file.getPathInPackage());

			files.filter(isNotScssImport).forEach(compileFile);

			function processFile(file) {
				const source = {
					path: ImportPathHelpers.getImportPathInPackage(file),
					contents: file.getContentsAsString()
				};

				return processor.process(source, './', allFiles)
					.then(result => {
						if (result.source)
							file.addStylesheet({
								data: result.source,
								path: getOutputPath(file.getPathInPackage(), pluginOptions.outputCssFilePath) + '.css',
								sourceMap: JSON.stringify(result.sourceMap),
								lazy: false
							});

						if (result.tokens) {
							file.addJavaScript({
								data: Babel.compile('' +
									`const styles = ${JSON.stringify(result.tokens)};
							 export { styles as default, styles };`).code,
								path: getOutputPath(file.getPathInPackage(), pluginOptions.outputJsFilePath) + '.js',
								sourcePath: getOutputPath(file.getPathInPackage(), pluginOptions.outputJsFilePath) + '.js',
								lazy: false,
								bare: false,
							});
						}
					}).await();
			}
		}

		function hasUnderscore(file) {
			return path.basename(file)[0] === '_';
		}
	}
};


function processFiles(files) {

}

function createAllFilesMap(files) {
	const allFiles = new Map();
	files.forEach((inputFile) => {
		const importPath = ImportPathHelpers.getImportPathInPackage(inputFile);
		allFiles.set(importPath, inputFile);
	});
	return allFiles;
}
