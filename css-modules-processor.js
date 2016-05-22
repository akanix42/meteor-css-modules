import postcssPlugins from './postcss-plugins';
import pluginOptionsWrapper from './options';
import getOutputPath from './get-output-path';

const postcss = Npm.require('postcss');
const Parser = Npm.require('css-modules-loader-core/lib/parser');
const pluginOptions = pluginOptionsWrapper.options;

export default class CssModulesProcessor {
	constructor(root, plugins) {
		this.root = root;
		this.importNumber = 0;
		this.resultsByFile = {};
		this.importsByFile = {};
	}

	process(_source, _relativeTo, allFiles) {
		return processInternal.call(this, null, _source, _relativeTo);

		function processInternal(parent, source, relativeTo, _trace) {
			relativeTo = relativeTo.replace(/.*(\{.*)/, '$1').replace(/\\/g, '/');
			source = getSourceContents(source, relativeTo);
			let trace = _trace || String.fromCharCode(this.importNumber++);
			if (parent) {
				const parentImports = this.importsByFile[parent.path] = (this.importsByFile[source.path] || []);
				parentImports.push(source.pathInApp);
			}
			return new Promise((resolve, reject) => {
				const result = this.resultsByFile[source.path];
				if (result)
					return resolve(parent ? result.tokens : result);

				this.load(source.contents, source.path, trace, processInternal.bind(this, source))
					.then(({ injectableSource, exportTokens, sourceMap }) => {
						const imports = this.importsByFile[source.path];
						const result = this.resultsByFile[source.path] = {
							source: injectableSource,
							tokens: exportTokens,
							sourceMap,
							imports
						};

						resolve(parent ? result.tokens : result);
					}, reject);
			});
		}

		function getSourceContents(source, relativeTo) {
			if (source instanceof String || typeof source === "string") {
				source = ImportPathHelpers.getImportPathRelativeToFile(source, relativeTo);
				return {
					path: source,
					pathInApp: ImportPathHelpers.getAppRelativeImportPath(source),
					contents: importModule(source)
				};
			}
			return source;
		}

		function importModule(importPath) {
			try {
				const file = allFiles.get(importPath);
				return file.getContentsAsString();
			} catch (e) {
				throw new Error(`CSS Modules: unable to read file ${importPath}: ${JSON.stringify(e)}`);
			}
		}
	}

	load(sourceString, sourcePath, trace, pathFetcher) {
		const parser = new Parser(pathFetcher, trace);
		sourcePath = ImportPathHelpers.getAbsoluteImportPath(sourcePath);
		return postcss(postcssPlugins.concat([parser.plugin]))
			.process(sourceString, {
				from: sourcePath,
				to: getOutputPath(sourcePath, pluginOptions.outputCssFilePath),
				map: {inline: false},
				parser: pluginOptions.parser ? Npm.require(pluginOptions.parser) : undefined
			})
			.then(result => {
				return {injectableSource: result.css, exportTokens: parser.exportTokens, sourceMap: result.map.toJSON()};
			});
	}

};
