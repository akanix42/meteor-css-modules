/* globals JSON */
import path from 'path';
import { MultiFileCachingCompiler } from 'meteor/caching-compiler';
import { Meteor } from 'meteor/meteor';
import { Babel } from 'meteor/babel-compiler';

import recursiveUnwrapped from 'recursive-readdir';
import ScssProcessor from './scss-processor';
import StylusProcessor from './stylus-processor';
import CssModulesProcessor from './css-modules-processor';
import IncludedFile from './included-file';
import pluginOptionsWrapper, { reloadOptions } from './options';
import getOutputPath from './get-output-path';
import profile from './helpers/profile';
import ImportPathHelpers from './helpers/import-path-helpers';
import { stripIndent, stripIndents } from 'common-tags';

let pluginOptions = pluginOptionsWrapper.options;
const recursive = Meteor.wrapAsync(recursiveUnwrapped);

export default class CssModulesBuildPlugin extends MultiFileCachingCompiler {
  constructor() {
    super({
      compilerName: 'mss',
      defaultCacheSize: 1024 * 1024 * 10
    });
    this.profilingResults = {
      processFilesForTarget: null,
      _transpileScssToCss: null,
      _transpileCssModulesToCss: null
    };

    this.preprocessors = null;
    this.cssModulesProcessor = null;
    this.filesByName = null;
    this.optionsHash = null;

    this.reloadOptions = reloadOptions;
  }

  processFilesForTarget(files) {
    pluginOptions = this.reloadOptions();
    if (!pluginOptions.cache.enableCache)
      this._cache.reset();
    this.optionsHash = pluginOptions.hash;
    const start = profile();

    files = removeFilesFromExcludedFolders(files);
    files = addFilesFromIncludedFolders(files);

    // this._prepInputFiles(files);
    this._setupPreprocessors();
    this.cssModulesProcessor = new CssModulesProcessor(pluginOptions);
    this.filesByName = null;

    super.processFilesForTarget(files);

    this.profilingResults.processFilesForTarget = profile(start, 'processFilesForTarget');

    function removeFilesFromExcludedFolders(files) {
      if (!pluginOptions.ignorePaths.length) {
        return files;
      }

      const ignoredPathsRegExps = pluginOptions.ignorePaths.map(pattern => new RegExp(pattern));
      const shouldKeepFile = file => !ignoredPathsRegExps.some(regex => regex.test(file.getPathInPackage()));

      return files.filter(shouldKeepFile);
    }

    function addFilesFromIncludedFolders(files) {
      pluginOptions.explicitIncludes.map(folderPath => {
        const includedFiles = recursive(folderPath, [onlyAllowExtensionsHandledByPlugin]);
        files = files.concat(includedFiles.map(filePath => new IncludedFile(filePath.replace(/\\/g, '/'), files[0])));

        function onlyAllowExtensionsHandledByPlugin(file, stats) {
          let extension = path.extname(file);
          if (extension) {
            extension = extension.substring(1);
          }
          return !stats.isDirectory() && pluginOptions.extensions.indexOf(extension) === -1;
        }
      });
      return files;
    }
  }

  _prepInputFiles(files) {
    files.forEach(file => {
      file.referencedImportPaths = [];

      file.contents = file.getContentsAsString() || '';
      if (pluginOptions.globalVariablesText) {
        file.contents = `${pluginOptions.globalVariablesText}\n\n${file.contents}`;
      }
      file.rawContents = file.contents;
    });
  }

  _setupPreprocessors() {
    this.preprocessors = [];
    if (pluginOptions.enableSassCompilation) {
      this.preprocessors.push(new ScssProcessor(pluginOptions));
    }
    if (pluginOptions.enableStylusCompilation) {
      this.preprocessors.push(new StylusProcessor(pluginOptions));
    }
  }

  isRoot(inputFile) {
    if ('isRoot' in inputFile) {
      return inputFile.isRoot;
    }

    let isRoot = null;
    for (let i = 0; i < this.preprocessors.length; i++) {
      const preprocessor = this.preprocessors[i];
      if (preprocessor.shouldProcess(inputFile)) {
        if (preprocessor.isRoot(inputFile)) {
          inputFile.preprocessor = preprocessor;
          inputFile.isRoot = true;
          return true;
        }
        isRoot = false;
      }
    }
    inputFile.isRoot = isRoot === null ? true : isRoot;
    /* If no preprocessors handle this file, it's automatically considered a root file. */
    return inputFile.isRoot;
  }

  compileOneFile(inputFile, filesByName) {
    this._updateFilesByName(filesByName);

    this._prepInputFile(inputFile);
    this._preprocessFile(inputFile, filesByName);
    this._transpileCssModulesToCss(inputFile, filesByName).await();

    const compileResult = this._generateOutput(inputFile);
    return { compileResult, referencedImportPaths: inputFile.referencedImportPaths };
  }

  _generateOutput(inputFile) {
    const filePath = inputFile.getPathInPackage();
    const isLazy = filePath.split('/').indexOf('imports') >= 0;
    const shouldAddStylesheet = inputFile.getArch().indexOf('web') === 0;

    const compileResult = { isLazy, filePath };
    if (!isLazy && shouldAddStylesheet && inputFile.contents) {
      compileResult.stylesheet = inputFile.contents;
    }

    const importsCode = inputFile.imports
      ? inputFile.imports.map(importPath => `import '${importPath}';`).join('\n')
      : '';

    const stylesheetCode = (isLazy && shouldAddStylesheet && inputFile.contents)
      ? stripIndent`
         import modules from 'meteor/modules';
				 modules.addStyles(${JSON.stringify(inputFile.contents)});`
      : '';

    const tokensCode = inputFile.tokens
      ? stripIndent`
         const styles = ${JSON.stringify(inputFile.tokens)};
         export { styles as default, styles };`
      : '';

    if (importsCode || stylesheetCode || tokensCode) {
      compileResult.javascript = tryBabelCompile(stripIndents`
					${importsCode}
					${stylesheetCode}
					${tokensCode}`
      );
    }

    return compileResult;

    function tryBabelCompile(code) {
      try {
        return Babel.compile(code).code;
      } catch (err) {
        console.error(`\n/~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
        console.error(`Processing Step: Babel compilation`);
        console.error(`Unable to compile ${filePath}\n${err}`);
        console.error('Source: \n// <start of file>\n', code.replace(/^\s+/gm, ''));
        console.error(`// <end of file>`);
        console.error(`\n/~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
        throw err;
      }
    }
  }

  _updateFilesByName(filesByName) {
    if (this.filesByName) return;
    this.filesByName = filesByName;
    filesByName._get = filesByName.get;
    filesByName.get = (key) => {
      const file = filesByName._get(key);
      this._prepInputFile(file);
      this.isRoot(file);
      return file;
    };
  }

  _prepInputFile(file) {
    if (file.isPrepped) {
      return;
    }

    file.referencedImportPaths = [];

    file.contents = file.getContentsAsString() || '';
    if (pluginOptions.globalVariablesText) {
      file.contents = `${pluginOptions.globalVariablesText}\n\n${file.contents}`;
    }
    file.rawContents = file.contents;

    file.isPrepped = true;
  }

  _preprocessFile(inputFile, filesByName) {
    if (inputFile.preprocessor)
      inputFile.preprocessor.process(inputFile, filesByName);
  }

  async _transpileCssModulesToCss(file, filesByName) {
    const startedAt = profile();

    await this.cssModulesProcessor.process(file, filesByName);

    this.profilingResults._transpileCssModulesToCss = (this.profilingResults._transpileCssModulesToCss || 0) + startedAt;
  }

  addCompileResult(file, result) {
    if (result.stylesheet) {
      file.addStylesheet({
        data: result.stylesheet,
        path: getOutputPath(result.filePath, pluginOptions.outputCssFilePath) + '.css',
        sourcePath: getOutputPath(result.filePath, pluginOptions.outputCssFilePath) + '.css',
        sourceMap: JSON.stringify(result.sourceMap),
        lazy: false
      });
    }

    if (result.javascript) {
      file.addJavaScript({
        data: result.javascript,
        path: getOutputPath(result.filePath, pluginOptions.outputJsFilePath) + '.js',
        sourcePath: getOutputPath(result.filePath, pluginOptions.outputJsFilePath),
        lazy: result.isLazy,
        bare: false,
      });
    }
  }

  compileResultSize(compileResult) {
    return JSON.stringify(compileResult).length;
  }

  getCacheKey(inputFile) {
    return `${this.optionsHash}...${inputFile.getSourceHash()}`;
  }

  getAbsoluteImportPath(inputFile) {
    const importPath = ImportPathHelpers.getImportPathInPackage(inputFile);
    inputFile.importPath = importPath;
    return importPath;
  }

};

