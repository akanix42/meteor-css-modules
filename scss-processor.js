import path from 'path';
import fs from 'fs';
import sass from 'node-sass';
import IncludedFile from './included-file';
import pluginOptionsWrapper from './options';

const pluginOptions = pluginOptionsWrapper.options;

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

			const { sourceContent, sourceMap } = this.load(sourceFile);
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

	load(sourceFile) {
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

		const output = sass.renderSync(options);
		return {sourceContent: output.css.toString('utf-8'), sourceMap: output.map};

		function importer(sourceFilePath, relativeTo) {
			const sourceFile = getSourceContents(this.fileCache, sourceFilePath, relativeTo);
			if (!sourceFile)
				return '';

			return sourceFile;
		}

		function getSourceContents(fileCache, source, relativeTo) {
			if (source instanceof String || typeof source === "string") {
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
				const originalImportPath = importPath;
				if (!path.extname(importPath))
					importPath += '.scss';

				let file = allFiles.get(importPath);
				if (!file && path.basename(file).indexOf('_' === -1))
					file = allFiles.get(`${path.dirname(importPath)}/_${path.basename(importPath)}`);
				if (!file) {
					file = new IncludedFile(discoverImportPath(originalImportPath), sourceFile);
					allFiles.set(originalImportPath, file);
				}

				return {contents: file.rawContents || file.getContentsAsString(), file: importPath};
				return {contents: file.getContentsAsString(), file: importPath};

				function discoverImportPath(importPath) {
					const potentialPaths = [importPath];
					const potentialFileExtensions = pluginOptions.enableSassCompilation === true ? pluginOptions.extensions : pluginOptions.enableSassCompilation;

					if (!path.extname(importPath))
						potentialFileExtensions.forEach(extension=>potentialPaths.push(`${importPath}.${extension}`));
					if (path.basename(importPath)[0] !== '_')
						[].concat(potentialPaths).forEach(potentialPath=>potentialPaths.push(`${path.dirname(potentialPath)}/_${path.basename(potentialPath)}`));

					for (let i = 0, potentialPath = potentialPaths[i]; i < potentialPaths.length; i++, potentialPath = potentialPaths[i])
						if (fs.existsSync(potentialPaths[i]))
							return potentialPath;

					throw new Error(`File '${importPath}' not found at any of the following paths: ${JSON.stringify(potentialPaths)}`);
				}
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
