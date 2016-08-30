/* globals Npm */
import loadPostcssPlugins from './postcss-plugins';
import getOutputPath from './get-output-path';
import ImportPathHelpers from './helpers/import-path-helpers';

import camelcase from 'camelcase';
import postcss from 'postcss';
import Parser from 'css-modules-loader-core/lib/parser';

export default class CssModulesProcessor {
  constructor(pluginOptions) {
    this.importNumber = 0;
    this.resultsByFile = {};
    this.importsByFile = {};
    this.importTreeByFile = {};
    this.filesByName = null;
    this.pluginOptions = pluginOptions;
    this.postcssPlugins = loadPostcssPlugins(pluginOptions);
  }

  async process(file, filesByName) {
    this.filesByName = filesByName;
    if (this.pluginOptions.passthroughPaths.some(regex => regex.test(file.getPathInPackage()))) {
      return;
    }

    const source = {
      path: file.importPath,
      contents: file.contents
    };

    const result = await this._processFile(source);
    file.contents = result.css;
    file.tokens = result.tokens;
    file.sourceMap = result.sourceMap;
    file.imports = result.imports;
    file.referencedImportPaths = [...new Set([...file.referencedImportPaths, ...result.importTree])];
  }

  async _processFile(source, trace = String.fromCharCode(this.importNumber++)) {
    const result = this.resultsByFile[source.path];
    if (result) {
      return result;
    }

    const { css, tokens, sourceMap } = await this._transpileFile(source.contents, source.path, trace, this._importFile.bind(this, source));

    const imports = (this.importsByFile[source.path] || []).map(importedFile => importedFile.relativePath);
    const importTree = this._generateImportTree(source.path);
    return this.resultsByFile[source.path] = {
      css,
      tokens,
      sourceMap,
      imports,
      importTree
    };
  }

  async _importFile(parent, source, relativeTo, trace) {
    relativeTo = fixRelativePath(relativeTo);
    source = loadFile(source, relativeTo, this.filesByName);
    const parentImports = this.importsByFile[parent.path] = (this.importsByFile[parent.path] || []);
    parentImports.push({ relativePath: source.originalPath, absolutePath: source.path });

    return (await this._processFile(source, trace)).tokens;

    function fixRelativePath(relativeTo) {
      return relativeTo.replace(/.*(\{.*)/, '$1').replace(/\\/g, '/');
    }

    function loadFile(source, relativeTo, filesByName) {
      if (source instanceof Object) {
        return source;
      }

      const originalPath = source.replace(/^["'](.*)["']$/, '$1');
      source = ImportPathHelpers.getImportPathRelativeToFile(source, relativeTo);
      return {
        path: source,
        originalPath,
        contents: loadFileContents(source, filesByName)
      };
    }

    function loadFileContents(importPath, filesByName) {
      try {
        const file = filesByName.get(importPath);
        return file.contents;
      } catch (e) {
        throw new Error(`CSS Modules: unable to read file ${importPath}: ${JSON.stringify(e)}`);
      }
    }
  }

  async _transpileFile(sourceString, sourcePath, trace, pathFetcher) {
    const cssModulesParser = new Parser(pathFetcher, trace);
    sourcePath = ImportPathHelpers.getAbsoluteImportPath(sourcePath);
    const result = await postcss(this.postcssPlugins.concat([cssModulesParser.plugin]))
      .process(sourceString, {
        from: sourcePath,
        to: getOutputPath(sourcePath, this.pluginOptions.outputCssFilePath),
        map: { inline: false },
        parser: this.pluginOptions.parser ? require(this.pluginOptions.parser) : undefined
      });

    return {
      css: result.css,
      tokens: transformTokens(cssModulesParser.exportTokens, this.pluginOptions.jsClassNamingConvention),
      sourceMap: result.map.toJSON()
    };

    function transformTokens(tokens, jsClassNamingConvention) {
      if (!jsClassNamingConvention.camelCase) {
        return tokens;
      }

      let transformedTokens = {};
      let keys = Object.keys(tokens);
      keys.forEach(key => transformedTokens[camelcase(key)] = tokens[key]);
      return transformedTokens;
    }
  }

  _generateImportTree(filePath) {
    /* If we've already worked out the import tree, return it. */
    let imports = this.importTreeByFile[filePath];
    if (imports) return imports;

    /* If this file has no imports, return an empty array for concatenating with referencedImportPaths. */
    imports = this.importsByFile[filePath];
    if (!imports) return [];

    /* If this file has imports, traverse them to build the import tree. */
    const absoluteImports = imports.map(importedFile => importedFile.absolutePath);
    return this.importTreeByFile[filePath] = absoluteImports.concat(absoluteImports.reduce((combinedImports, importPath) => combinedImports.concat(this._generateImportTree(importPath)), []));
  }
};
