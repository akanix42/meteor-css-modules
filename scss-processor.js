import path from 'path';
import fs from 'fs';
import IncludedFile from './included-file';
import pluginOptionsWrapper from './options';

const pluginOptions = pluginOptionsWrapper.options;

const sass = pluginOptions.enableSassCompilation ? require('node-sass') : null;

export default class ScssProcessor {
	constructor() {
		this.fileCache = {};
		this.filesByName = null;
	}

	isRoot(inputFile) {
		const fileOptions = inputFile.getFileOptions();
		if (fileOptions.hasOwnProperty('isImport')) {
			return !fileOptions.isImport;
		}

		return !hasUnderscore(inputFile.getPathInPackage());

		function hasUnderscore(file) {
			return path.basename(file)[0] === '_';
		}
	}

	shouldProcess(file) {
		return isScssFile(file);

		function isScssFile(file) {
			if (pluginOptions.enableSassCompilation === true)
				return true;

			const extension = path.extname(file.getPathInPackage()).substring(1);
			return pluginOptions.enableSassCompilation.indexOf(extension) !== -1;
		}
	}

	process(file, filesByName) {
		this.filesByName = filesByName;
		try {
			this._process(file);
		} catch (err) {
			const numberOfAdditionalLines = pluginOptions.globalVariablesTextLineCount
				? pluginOptions.globalVariablesTextLineCount + 1
				: 0;
			const adjustedLineNumber = err.line - numberOfAdditionalLines;
			console.error(`\n/~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
			console.error(`Processing Step: SCSS compilation`);
			console.error(`Unable to compile ${source.path}\nLine: ${adjustedLineNumber}, Column: ${err.column}\n${err}`);
			console.error(`\n/~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
			throw err;
		}
	}

	_process(file) {
		if (file.contents)
			return;

		const sourceFile = this._wrapFileForNodeSass(file);
		const { css, sourceMap } = this._transpile(sourceFile);
		file.contents = css;
		file.sourceMap = sourceMap;
	}

	_wrapFileForNodeSass(file) {
		return { path: file.importPath, contents: file.rawContents, file: file }
	}

	_discoverImportPath(importPath) {
		const potentialPaths = [importPath];
		const potentialFileExtensions = pluginOptions.enableSassCompilation === true ? pluginOptions.extensions : pluginOptions.enableSassCompilation;

		if (!path.extname(importPath))
			potentialFileExtensions.forEach(extension=>potentialPaths.push(`${importPath}.${extension}`));
		if (path.basename(importPath)[0] !== '_')
			[].concat(potentialPaths).forEach(potentialPath=>potentialPaths.push(`${path.dirname(potentialPath)}/_${path.basename(potentialPath)}`));

		for (let i = 0, potentialPath = potentialPaths[i]; i < potentialPaths.length; i++, potentialPath = potentialPaths[i])
			if (fs.existsSync(potentialPaths[i]) && fs.lstatSync(potentialPaths[i]).isFile())
				return potentialPath;

		throw new Error(`File '${importPath}' not found at any of the following paths: ${JSON.stringify(potentialPaths)}`);
	}

	_transpile(sourceFile) {
		const sassOptions = {
			sourceMap: true,
			sourceMapContents: true,
			sourceMapEmbed: false,
			sourceComments: false,
			sourceMapRoot: '.',
			indentedSyntax: sourceFile.file.getExtension() === 'sass',
			outFile: `.${sourceFile.file.getBasename()}`,
			importer: this._importFile.bind(this),
			includePaths: [],
			file: sourceFile.path,
			data: sourceFile.rawContents
		};

		/* Empty options.data workaround from fourseven:scss */
		if (!sassOptions.data.trim())
			sassOptions.data = '$fakevariable : blue;';

		const output = sass.renderSync(sassOptions);
		return { css: output.css.toString('utf-8'), sourceMap: output.map };
	}

	_importFile(sourceFilePath, relativeTo, rootFile) {
		let importPath = ImportPathHelpers.getImportPathRelativeToFile(sourceFilePath, relativeTo);
		importPath = this._discoverImportPath(importPath);
		let inputFile = this.filesByName[importPath];
		if (inputFile)
			rootFile.referencedImportPaths.push(importPath);
		else
			this._createIncludedFile(importPath, rootFile);

		return this._wrapFileForNodeSass(inputFile);
	}

	_createIncludedFile(importPath, rootFile) {
		const file = new IncludedFile(importPath, rootFile);
		file.prepInputFile().await();
		this.filesByName.set(importPath, file);
	}

};
