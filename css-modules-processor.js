/* globals ImportPathHelpers, Npm */
import postcssPlugins from './postcss-plugins';
import pluginOptionsWrapper from './options';
import getOutputPath from './get-output-path';

import camelcase from 'camelcase';
const postcss = Npm.require('postcss');
const Parser = Npm.require('css-modules-loader-core/lib/parser');
const pluginOptions = pluginOptionsWrapper.options;

export default class CssModulesProcessor {
  constructor() {
    this.importNumber = 0;
    this.resultsByFile = {};
    this.importsByFile = {};
    this.filesByName = null;
  }

  async process(file, filesByName) {
    this.filesByName = filesByName;
    if (pluginOptions.passthroughPaths.some(regex => regex.test(file.getPathInPackage()))) {
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
  }

  async _processFile(source, trace = String.fromCharCode(this.importNumber++)) {
    const result = this.resultsByFile[source.path];
    if (result) {
      return result;
    }

    const { css, tokens, sourceMap } = await this._transpileFile(source.contents, source.path, trace, this._importFile.bind(this, source));

    const imports = this.importsByFile[source.path];
    return this.resultsByFile[source.path] = {
      css,
      tokens,
      sourceMap,
      imports
    };
  }

  async _importFile(parent, source, relativeTo, trace) {
    relativeTo = fixRelativePath(relativeTo);
    source = loadFile(source, relativeTo, this.filesByName);
    const parentImports = this.importsByFile[parent.path] = (this.importsByFile[source.path] || []);
    parentImports.push(source.originalPath);

    return await (this._processFile(source, trace)).tokens;

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
    const result = await postcss(postcssPlugins.concat([cssModulesParser.plugin]))
      .process(sourceString, {
        from: sourcePath,
        to: getOutputPath(sourcePath, pluginOptions.outputCssFilePath),
        map: { inline: false },
        parser: pluginOptions.parser ? Npm.require(pluginOptions.parser) : undefined
      });

    return {
      css: result.css,
      tokens: transformTokens(cssModulesParser.exportTokens),
      sourceMap: result.map.toJSON()
    };

    function transformTokens(tokens) {
      if (!pluginOptions.jsClassNamingConvention.camelCase) {
        return tokens;
      }

      let transformedTokens = {};
      let keys = Object.keys(tokens);
      keys.forEach(key => transformedTokens[camelcase(key)] = tokens[key]);
      return transformedTokens;
    }
  }
};
