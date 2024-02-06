import path from 'path';
import pluginOptions from './options';
import logger from './logger';

export default class StylusProcessor {
  constructor(pluginOptions) {
    this.fileCache = {};
    this.filesByName = null;
    this.pluginOptions = pluginOptions;
    this.stylus = pluginOptions.enableStylusCompilation ? require('stylus') : null;
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
    const stylusCompilationExtensions = this.pluginOptions.enableStylusCompilation;
    if (!stylusCompilationExtensions || typeof stylusCompilationExtensions === 'boolean') {
      return stylusCompilationExtensions;
    }

    return stylusCompilationExtensions.some((extension) => file.getPathInPackage().endsWith(extension));
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
      logger.error(`Processing Step: Stylus compilation`);
      logger.error(`Unable to compile ${file.importPath}\nLine: ${adjustedLineNumber}, Column: ${err.column}\n${err}`);
      logger.error(`\n/~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
      throw err;
    }
  }

  async _process(file) {
    if (file.isPreprocessed) return;

    const { css, sourceMap } = await this._transpile(file);
    file.contents = css;
    file.sourceMap = sourceMap;
    file.isPreprocessed = true;
  }

  async _transpile(sourceFile) {
    const options = {
      filename: sourceFile.importPath,
      sourcemap: {
        comment: false
      }
    };

    const p = new Promise((resolve, reject) => {
      this.stylus.render(sourceFile.rawContents, options, (err, css) => {
        if (err) {
          reject(err);
        }
        resolve(css);
      });
    });
    const css = await p

    return { css, sourceMap: this.stylus.sourcemap }
  }
};
