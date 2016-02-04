var postcss = Npm.require('postcss');
var Parser = Npm.require('css-modules-loader-core/lib/parser');

CssModulesProcessor = class CssModulesProcessor {
	constructor(root, plugins) {
		this.root = root;
		this.importNr = 0;
		this.plugins = plugins;
		this.tokensByFile = {};
	}

	process(_source, _relativeTo, allFiles) {
		return processInternal.call(this, _source, _relativeTo);

		function processInternal(source, relativeTo, _trace) {
			relativeTo = relativeTo.replace(/.*(\{.*)/, '$1').replace(/\\/g, '/');
			source = getSourceContents(source, relativeTo);
			var trace = _trace || String.fromCharCode(this.importNr++);

			return new Promise((resolve, reject) => {
				const tokens = this.tokensByFile[source.path];
				if (tokens)
					return resolve(tokens);

				this.load(source.contents, source.path, trace, processInternal.bind(this))
					.then(({ injectableSource, exportTokens, sourceMap }) => {
						this.tokensByFile[source.path] = exportTokens;
						resolve({source: injectableSource, tokens: exportTokens, sourceMap: sourceMap});
					}, reject);
			});
		}

		function getSourceContents(source, relativeTo) {
			if (source instanceof String || typeof source === "string") {
				source = ImportPathHelpers.getImportPathRelativeToFile(source, relativeTo);
				return {path: source, contents: importModule(source)};
			}
			return source;
		}

		function importModule(importPath) {
			try {
				var file = allFiles.get(importPath);
				var contents = file.getContentsAsString();
				return contents;
			} catch (e) {
				throw new Error(`CSS Modules: unable to read file ${importPath}: ${JSON.stringify(e)}`);
			}
		}
	}

	load(sourceString, sourcePath, trace, pathFetcher) {
		let parser = new Parser(pathFetcher, trace);

		return postcss(this.plugins.concat([parser.plugin]))
			.process(sourceString, {
				from: sourcePath,
				to: sourcePath.replace('\.mss$', '.css'),
				map: {inline: false}
			})
			.then(result => {
				return {injectableSource: result.css, exportTokens: parser.exportTokens, sourceMap: result.map};
			});
	}

};
