import path from 'path';
import LRU from 'lru-cache';
import { Meteor } from 'meteor/meteor';
import recursiveUnwrapped from 'recursive-readdir';
import ScssProcessor from './scss-processor';
import StylusProcessor from './stylus-processor';
import CssModulesProcessor from './css-modules-processor';
import IncludedFile from './included-file';
import plugins from './postcss-plugins';
import pluginOptionsWrapper, { reloadOptions } from './options';
import getOutputPath from './get-output-path';

let pluginOptions = pluginOptionsWrapper.options;
recursive = Meteor.wrapAsync(recursiveUnwrapped);
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
		console.log(`${message} ${time}ms`);

	return time;
}

export default class CssModulesBuildPlugin extends CachingCompiler {
	constructor() {
		super({
			compilerName: 'mss',
			defaultCacheSize: 1024 * 1024 * 10
		});

		this._cache = new LRU({
			max: this._cacheSize,
			length: (value) => this.compileResultSize(value),
		});
	}

	processFilesForTarget(files) {
		pluginOptions = reloadOptions();

		const start = profile();
		files = removeFilesFromExcludedFolders(files);
		files = addFilesFromIncludedFolders(files);

		const allFiles = createAllFilesMap(files);
		const uncachedFiles = processCachedFiles.call(this, files);
		if (pluginOptions.enableSassCompilation)
		if (pluginOptions.enableSassCompilation)
			compileScssFiles.call(this, uncachedFiles);
		if (pluginOptions.enableStylusCompilation)
			compileStylusFiles.call(this, uncachedFiles);

		let passthroughFiles;
		({files, passthroughFiles} = extractPassthroughFiles(uncachedFiles));
		processPassthroughFiles(passthroughFiles);
		compileCssModules.call(this, files);

		profile(start, 'compilation complete in');

		function processCachedFiles(files) {
			const filesToProcess = [];
			files.forEach(inputFile => {
				filesToProcess.push(inputFile);
			});

			return filesToProcess;
		}

		function removeFilesFromExcludedFolders(files) {
			if (!pluginOptions.ignorePaths.length)
				return files;

			const ignoredPathsRegExps = pluginOptions.ignorePaths.map(pattern=> new RegExp(pattern));
			const shouldKeepFile = file => !ignoredPathsRegExps.some(regex=>regex.test(file.getPathInPackage()));

			return files.filter(shouldKeepFile);
		}

		function addFilesFromIncludedFolders(files) {
			pluginOptions.explicitIncludes.map(folderPath=> {

				const includedFiles = recursive(folderPath, [onlyAllowExtensionsHandledByPlugin]);
				files = files.concat(includedFiles.map(filePath=>new IncludedFile(filePath.replace(/\\/g, '/'), files[0])));

				function onlyAllowExtensionsHandledByPlugin(file, stats) {
					let extension = path.extname(file);
					if (extension)
						extension = extension.substring(1);
					return !stats.isDirectory() && pluginOptions.extensions.indexOf(extension) === -1;
				}
			});
			return files;
		}

		function extractPassthroughFiles(files) {
			const passthroughFiles = [];
			if (!pluginOptions.passthroughPaths.length)
				return {passthroughFiles, files};
			const otherFiles = [];
			const createPatternRegExp = pattern => typeof pattern === 'string' ? new RegExp(pattern) : new RegExp(pattern[0], pattern[1]);
			const passthroughPathsRegExps = pluginOptions.passthroughPaths.map(createPatternRegExp);

			files.forEach(file=> {
				if (passthroughPathsRegExps.some(regex=>regex.test(file.getPathInPackage())))
					passthroughFiles.push(file);
				else
					otherFiles.push(file);
			});

			return {passthroughFiles, files: otherFiles};
		}

		function processPassthroughFiles(files) {
			files.forEach(inputFile => {
				inputFile.addStylesheet({
					data: inputFile.getContentsAsString(),
					path: inputFile.getPathInPackage()
				});
			});
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
				file.rawContents = file.contents = `${pluginOptions.globalVariablesText}\n\n${contents || ''}`;

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
					console.error(`\n/~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
					console.error(`Processing Step: SCSS compilation`);
					console.error(`Unable to compile ${source.path}\n${err}`);
					console.error(`\n/~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
					throw err;
				}

				file.getContentsAsString = function getContentsAsString() {
					return result.source;
				};
			}
		}

		function compileStylusFiles(files) {
			const processor = new StylusProcessor('./', allFiles);
			const isStylusRoot = (file)=>isStylus(file) && isRoot(file);
			const compileFile = compileStylusFile.bind(this);
			files.filter(isStylusRoot).forEach(compileFile);

			function isStylus(file) {
				if (pluginOptions.enableStylusCompilation === true)
					return true;

				return _.find(pluginOptions.enableStylusCompilation, (ext) => (
					file.getPathInPackage().endsWith(ext)
				))
			}

			function isRoot(inputFile) {
				const fileOptions = inputFile.getFileOptions();
				if (fileOptions.hasOwnProperty('isImport')) {
					return !fileOptions.isImport;
				}
				return !hasUnderscore(inputFile.getPathInPackage());
			}

			function compileStylusFile(file) {
				const contents = file.contents = file.getContentsAsString();
				file.rawContents = file.contents = `${pluginOptions.globalVariablesText}\n\n${contents || ''}`;

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
					console.error(`\n/~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
					console.error(`Processing Step: Stylus compilation`);
					console.error(`Unable to compile ${source.path}\n${err}`);
					console.error(`\n/~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
					throw err;
				}

				file.getContentsAsString = function getContentsAsString() {
					return result.source;
				};
			}
		}

		function compileCssModules(files) {
			const processor = new CssModulesProcessor('./');
			const isNotScssImport = (file) => !hasUnderscore(file.getPathInPackage());

			files.filter(isNotScssImport).forEach(processFile.bind(this));

			function processFile(file) {
				const source = {
					path: ImportPathHelpers.getImportPathInPackage(file),
					contents: file.getContentsAsString()
				};

				return processor.process(source, './', allFiles)
					.then(result => {
						// Save what we've compiled.
						this.addCompileResult(file, result);
					}).await();
			}
		}

		function hasUnderscore(file) {
			return path.basename(file)[0] === '_';
		}
	}

	addCompileResult(file, result) {
		const filePath = file.getPathInPackage();
		const isLazy = filePath.split('/').indexOf('imports') >= 0;
		const shouldAddStylesheet = file.getArch().indexOf('web') === 0;

		if (!isLazy && shouldAddStylesheet) {
			if (result.source) {
				file.addStylesheet({
					data: result.source,
					path: getOutputPath(filePath, pluginOptions.outputCssFilePath) + '.css',
					sourcePath: getOutputPath(filePath, pluginOptions.outputCssFilePath) + '.css',
					sourceMap: JSON.stringify(result.sourceMap),
					lazy: false
				});
			}
		}

		const importsCode = result.imports
			? result.imports.map(importPath=>`import '${importPath}';`).join('\n')
			: '';
		const stylesheetCode = (isLazy && shouldAddStylesheet && result.source)
			? `import modules from 'meteor/modules';
					 modules.addStyles(${JSON.stringify(result.source)});`
			: '';

		const tokensCode = result.tokens
			? `const styles = ${JSON.stringify(result.tokens)};
					 export { styles as default, styles };`
			: '';

		if (stylesheetCode || tokensCode) {
			file.addJavaScript({
				data: tryBabelCompile(`
					${importsCode}
					${stylesheetCode}
					${tokensCode}`),
				path: getOutputPath(filePath, pluginOptions.outputJsFilePath) + '.js',
				sourcePath: getOutputPath(filePath, pluginOptions.outputJsFilePath),
				lazy: isLazy,
				bare: false,
			});
		}

		function tryBabelCompile(code) {
			try {
				return Babel.compile(code).code;
			} catch (err) {
				console.error(`\n/~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
				console.error(`Processing Step: CSS Modules compilation`);
				console.error(`Unable to compile ${filePath}\n${err}`);
				console.error('Source: \n// <start of file>\n', code.replace(/^\s+/gm, ''))
				console.error(`// <end of file>`);
				console.error(`\n/~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
				throw err;
			}
		}
	}

	compileResultSize(compileResult) {
		return compileResult.source.length + JSON.stringify(compileResult.tokens).length +
			this.sourceMapSize(compileResult.sourceMap);
	}

	/**
	 * modified version of implementation from caching-compiler package
	 */
	sourceMapSize(sm) {
		if (!sm) return 0;

		const mappings = sm.mappings || sm._mappings;
		const mappingsLength = mappings ? mappings.length : 0;
		let contentsLength = 0;
		if ('sourcesContent' in sm)
			(sm.sourcesContent || []).reduce((soFar, current) => soFar + (current ? current.length : 0), 0)
		else if ('_sourceContents' in sm)
			Object.keys(sm._sourceContents || {}).reduce((total, key) => total + sm._sourceContents[key], 0);

		return mappingsLength + contentsLength;
	}

	getCacheKey(inputFile) {
		return inputFile.getSourceHash();
	}

};

function createAllFilesMap(files) {
	const allFiles = new Map();
	files.forEach((inputFile) => {
		const importPath = ImportPathHelpers.getImportPathInPackage(inputFile);
		allFiles.set(importPath, inputFile);
	});
	return allFiles;
}
