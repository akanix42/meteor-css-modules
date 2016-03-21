import Future from 'fibers/future';
import sass from 'node-sass';
import path from 'path';

export default class ScssProcessor {
	constructor(root, allFiles) {
		this.root = root;
		this.fileCache = {};
		this.allFiles = allFiles;
	}

	process(file, _source, _relativeTo) {
		return processInternal.call(this, _source, _relativeTo);

		function processInternal(sourceFilePath, relativeTo) {
			relativeTo = relativeTo.replace(/.*(\{.*)/, '$1').replace(/\\/g, '/');
			const sourceFile = getSourceContents(sourceFilePath, relativeTo);
			if (!sourceFile)
				return '';

			const cachedResult = this.fileCache[sourceFile.path];
			if (cachedResult)
				return cachedResult;

			const { sourceContent, sourceMap } = this.load(sourceFile, processInternal.bind(this));
			return this.fileCache[sourceFile.path] = {contents: sourceContent, source: sourceContent, sourceMap: sourceMap};
		}

		function getSourceContents(source, relativeTo) {
			if (source instanceof String || typeof source === "string") {
				source = ImportPathHelpers.getImportPathRelativeToFile(source, relativeTo);
				return importModule(source);
			}
			return source;
		}

		function importModule(importPath) {
			try {
				if (!path.extname(importPath))
					importPath += '.scss';

				let file = allFiles.get(importPath);
				if (!file && path.basename(file).indexOf('_' === -1))
					file = allFiles.get(`${path.dirname(importPath)}/_${path.basename(importPath)}`);
				if (!file)
					console.log('\n\nimport: importPath');
				return {path: importPath, contents: file.getContentsAsString(), file: file};
			} catch (err) {
				console.error(err);
				file.error({
					message: `CSS modules SCSS compiler error: file not found: (${importPath}): ${JSON.stringify(err, Object.getOwnPropertyNames(err))}\n`,
					sourcePath: file.getDisplayPath()
				});
				return;
			}
		}

	}

	load(sourceFile, importer) {
		const sassFuture = new Future();
		const allFiles = this.allFiles;
		const options = {
			sourceMap: true,
			sourceMapContents: true,
			sourceMapEmbed: false,
			sourceComments: false,
			sourceMapRoot: '.',
			indentedSyntax: sourceFile.file.getExtension() === 'sass',
			outFile: `.${sourceFile.file.getBasename()}`,
			importer: importer.bind(this),
			includePaths: [],
			file: sourceFile.path,
			data: sourceFile.contents
		};

		// Empty options.data workaround from fourseven:scss
		if (!options.data.trim())
			options.data = '$fakevariable : blue;';

		let output = sass.renderSync(options, sassFuture.resolver());
		//output = sassFuture.wait();

		const compileResult = {sourceContent: output.css.toString('utf-8'), sourceMap: output.map};
		return compileResult;


		function importer(sourceFilePath, relativeTo) {
			const sourceFile = getSourceContents(this.fileCache, sourceFilePath, relativeTo);
			if (!sourceFile)
				return '';

			return sourceFile;
		}

		function getSourceContents(fileCache, source, relativeTo) {
			if (source instanceof String || typeof source === "string") {
				console.log(JSON.stringify(fileCache))
				console.log(source)
				console.log(relativeTo)
				const sourcePath = ImportPathHelpers.getImportPathRelativeToFile(source, relativeTo);
				const cachedResult = fileCache[sourcePath];
				if (cachedResult)
					return cachedResult;

				return importModule(sourcePath);
			}
			return source;
		}

		function importModule(importPath) {
			try {
				if (!path.extname(importPath))
					importPath += '.scss';

				let file = allFiles.get(importPath);
				if (!file && path.basename(file).indexOf('_' === -1))
					file = allFiles.get(`${path.dirname(importPath)}/_${path.basename(importPath)}`);
				if (!file)
					console.log('\n\nimport: importPath');
				return {contents: file.getContentsAsString()};
			} catch (err) {
				console.error(err);
				sourceFile.file.error({
					message: `CSS modules SCSS compiler error: file not found: (${importPath}): ${JSON.stringify(err, Object.getOwnPropertyNames(err))}\n`,
					sourcePath: sourceFile.file.getDisplayPath()
				});
				return new Error(`CSS modules SCSS compiler error: file not found: (${importPath}): ${JSON.stringify(err, Object.getOwnPropertyNames(err))}\n`);
			}
		}
	}
};
