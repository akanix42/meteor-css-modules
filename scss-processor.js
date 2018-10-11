import path from 'path';
import fs from 'fs';
import IncludedFile from './included-file';
import ImportPathHelpers from './helpers/import-path-helpers';
import logger from './logger';

export default class ScssProcessor {
  constructor(pluginOptions) {
    this.fileCache = {};
    this.filesByName = null;
    this.pluginOptions = pluginOptions;
    this.sass = pluginOptions.enableSassCompilation ? require('node-sass') : null;
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
    const sassCompilationExtensions = this.pluginOptions.enableSassCompilation;
    if (!sassCompilationExtensions || typeof sassCompilationExtensions === 'boolean') {
      return sassCompilationExtensions;
    }

    return sassCompilationExtensions.some((extension) => file.getPathInPackage().endsWith(extension));
  }

  process(file, filesByName) {
    this.filesByName = filesByName;
    try {
      this._process(file);
    } catch (err) {
      const numberOfAdditionalLines = this.pluginOptions.globalVariablesTextLineCount
        ? this.pluginOptions.globalVariablesTextLineCount + 1
        : 0;
      const adjustedLineNumber = err.line - numberOfAdditionalLines;
      logger.error(`\n/~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
      logger.error(`Processing Step: SCSS compilation`);
      logger.error(`Unable to compile ${file.importPath}\nLine: ${adjustedLineNumber}, Column: ${err.column}\n${err}`);
      logger.error(`\n/~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
      throw err;
    }
  }

  _process(file) {
    if (file.isPreprocessed) return;

    if (this.pluginOptions.enableDebugLog) {
      console.log(`***\nSCSS process: ${file.importPath}`);
    }
    const sourceFile = this._wrapFileForNodeSass(file);
    const { css, sourceMap } = this._transpile(sourceFile);
    file.contents = css;
    file.sourceMap = sourceMap;
    file.isPreprocessed = true;
  }

  _wrapFileForNodeSass(file) {
    return { path: file.importPath, contents: file.rawContents, file: file };
  }

  _discoverImportPath(importPath) {
    const potentialPaths = [importPath];
    const potentialFileExtensions = this.pluginOptions.enableSassCompilation === true ? this.pluginOptions.extensions : this.pluginOptions.enableSassCompilation;

      potentialFileExtensions.forEach(extension => potentialPaths.push(`${importPath}.${extension}`));
    if (path.basename(importPath)[0] !== '_') {
      [].concat(potentialPaths).forEach(potentialPath => potentialPaths.push(`${path.dirname(potentialPath)}/_${path.basename(potentialPath)}`));
    }

    for (let i = 0, potentialPath = potentialPaths[i]; i < potentialPaths.length; i++, potentialPath = potentialPaths[i]) {
      if (this.filesByName.has(potentialPath) || (fs.existsSync(potentialPaths[i]) && fs.lstatSync(potentialPaths[i]).isFile())) {
        return potentialPath;
      }
    }

    throw new Error(`File '${importPath}' not found at any of the following paths: ${JSON.stringify(potentialPaths, null, 2)}`);
  }

  _transpile(sourceFile) {
    const sassOptions = {
      sourceMap: true,
      sourceMapContents: true,
      sourceMapEmbed: false,
      sourceComments: false,
      sourceMapRoot: '.',
      omitSourceMapUrl: true,
      indentedSyntax: sourceFile.file.getExtension() === 'sass',
      outFile: `.${sourceFile.file.getBasename()}`,
      importer: this._importFile.bind(this, sourceFile),
      includePaths: [],
      file: sourceFile.path,
      data: sourceFile.contents
    };

    /* Empty options.data workaround from fourseven:scss */
    if (!sassOptions.data.trim()) {
      sassOptions.data = '$fakevariable : blue;';
    }

    const output = this.sass.renderSync(sassOptions);
    return { css: output.css.toString('utf-8'), sourceMap: JSON.parse(output.map.toString('utf-8')) };
  }

  _importFile(rootFile, sourceFilePath, relativeTo) {
    try {
      if (this.pluginOptions.enableDebugLog) {
        console.log(`***\nImport: ${sourceFilePath}\n rootFile: ${rootFile}`);
      }
      let importPath = ImportPathHelpers.getImportPathRelativeToFile(sourceFilePath, relativeTo);
      importPath = this._discoverImportPath(importPath);
      let inputFile = this.filesByName.get(importPath);
      if (inputFile) {
        rootFile.file.referencedImportPaths.push(importPath);
      } else {
        inputFile = this._createIncludedFile(importPath, rootFile);
      }

      return this._wrapFileForNodeSassImport(inputFile, importPath);
    } catch (err) {
      return err;
    }
  }

  _createIncludedFile(importPath, rootFile) {
    const file = new IncludedFile(importPath, rootFile);
    file.prepInputFile();
    this.filesByName.set(importPath, file);
    return file;
  }

  _wrapFileForNodeSassImport(file, importPath) {
    return { contents: file.rawContents, file: file.importPath || importPath };
  }

};
