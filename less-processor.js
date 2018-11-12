import Future from 'fibers/future';
import path from 'path';
import logger from './logger';

export default class LessProcessor {
  constructor(pluginOptions) {
    this.fileCache = {};
    this.filesByName = null;
    this.pluginOptions = pluginOptions;
    this.less = pluginOptions.enableLessCompilation ? require('less') : null;
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
    const lessCompilationExtensions = this.pluginOptions.enableLessCompilation;
    if (!lessCompilationExtensions || typeof lessCompilationExtensions === 'boolean') {
      return lessCompilationExtensions;
    }

    return lessCompilationExtensions.some((extension) => file.getPathInPackage().endsWith(extension));
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
      logger.error(`Processing Step: Less compilation`);
      logger.error(`Unable to compile ${file.importPath}\nLine: ${adjustedLineNumber}, Column: ${err.column}\n${err}`);
      logger.error(`\n/~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
      throw err;
    }
  }

  _process(file) {
    if (file.isPreprocessed) return;

    const {css, map} = this._transpile(file);

    file.contents = css;
    file.sourceMap = map;
    file.isPreprocessed = true;
  }

  _transpile(sourceFile) {
    const future = new Future();
    const options = {
      filename: sourceFile.importPath,
      sourceMap: {
        comment: false
      }
    };

    this.less.render(sourceFile.rawContents, options)
      .then(output => future.return(output), error => future.throw(error));

    return future.wait();
  }
};
