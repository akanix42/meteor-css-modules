import Future from 'fibers/future';
import stylus from 'stylus';
import path from 'path';
import fs from 'fs';
import IncludedFile from './included-file';
import pluginOptions from './options';

export default class StylusProcessor {
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
					importPath += '.styl';

				let file = allFiles.get(importPath);
				if (!file && path.basename(file).indexOf('_' === -1))
					file = allFiles.get(`${path.dirname(importPath)}/_${path.basename(importPath)}`);

				return {path: importPath, contents: file.getContentsAsString(), file: file};
			} catch (err) {
				console.error(err);
				file.error({
					message: `CSS modules Stylus compiler error: file not found: (${importPath}): ${JSON.stringify(err, Object.getOwnPropertyNames(err))}\n`,
					sourcePath: file.getDisplayPath()
				});
				return;
			}
		}
	}

	load(sourceFile) {
		const allFiles = this.allFiles;
		const future = new Future();
		const resolver = future.resolver();
		const options = {
			filename: sourceFile.path,
			sourcemap: {
				comment: false
			}
		};

		stylus.render(sourceFile.contents, options, function(err, css) {
			if (err) {
				return resolver(err);
			}

			resolver(null, {sourceContent: css, sourceMap: stylus.sourcemap});
		});

		return future.wait();

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
					message: `CSS modules Stylus compiler error: file not found: (${importPath}): ${JSON.stringify(err, Object.getOwnPropertyNames(err))}\n`,
					sourcePath: sourceFile.file.getDisplayPath()
				});
				return new Error(`CSS modules Stylus compiler error: file not found: (${importPath}): ${JSON.stringify(err, Object.getOwnPropertyNames(err))}\n`);
			}
		}
	}
};
