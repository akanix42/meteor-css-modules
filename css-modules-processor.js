import postcssPlugins from './postcss-plugins';
import pluginOptionsWrapper from './options';
import getOutputPath from './get-output-path';
import camelcase from 'camelcase';
import profile, { profileFunction } from './helpers/profile';

const postcss = Npm.require('postcss');
const Parser = Npm.require('css-modules-loader-core/lib/parser');
const pluginOptions = pluginOptionsWrapper.options;

export default class CssModulesProcessor {
	constructor(root, plugins) {
		this.root = root;
		this.importNumber = 0;
		this.resultsByFile = {};
		this.importsByFile = {};
		this.isProfilingInProgress = false;
		this.profilingResults = {
			load: 0,
			loadAlt: 0,
			getSourceContents: 0,
			promiseStart: 0,
			process: 0,
		}
	}

	displayProfilingResults() {
		const keys = Object.keys(this.profilingResults);
		keys.forEach(key=> {
			console.log(`cssModulesProcess::${key}: ${this.profilingResults[key]}ms`);
		});
	}

	process(_source, _relativeTo, allFiles) {
		const start = profile();
		return processInternal.call(this, null, _source, _relativeTo)
			.then(result => {
				this.profilingResults.process += profile(start);
				this.isProfilingInProgress = false;
				return result;
			});

		function processInternal(parent, source, relativeTo, _trace) {
			relativeTo = relativeTo.replace(/.*(\{.*)/, '$1').replace(/\\/g, '/');
			const getSourceContentsStart = profile();

			source = getSourceContents(source, relativeTo);
			this.profilingResults.getSourceContents += profile(getSourceContentsStart);
			let trace = _trace || String.fromCharCode(this.importNumber++);
			if (parent) {
				const parentImports = this.importsByFile[parent.path] = (this.importsByFile[source.path] || []);
				parentImports.push(source.originalPath);
			}
			const promiseStart = profile();
			return new Promise((resolve, reject) => {
				this.profilingResults.promiseStart += profile(promiseStart);
				let shouldSkipProfiling = this.isProfilingInProgress;
				const loadStart = profile();

				const result = this.resultsByFile[source.path];
				if (result)
					return resolve(parent ? result.tokens : result);


				this.isProfilingInProgress = true;

				this.load(source.contents, source.path, trace, processInternal.bind(this, source))
					.then(result => {
						if(!shouldSkipProfiling) {
							this.profilingResults.load += profile(loadStart);
						}
						return result;
					})
					.then(({ injectableSource, exportTokens, sourceMap }) => {
						const imports = this.importsByFile[source.path];
						const result = this.resultsByFile[source.path] = {
							source: injectableSource,
							tokens: exportTokens,
							sourceMap,
							imports
						};

						resolve(parent ? result.tokens : result);
					}, reject)
					.then(result => {
						if(!shouldSkipProfiling) {
							this.profilingResults.loadAlt += profile(loadStart);
						}
						return result;
					});
			});
		}

		function getSourceContents(source, relativeTo) {
			if (source instanceof String || typeof source === 'string') {
				const originalPath = source.replace(/^["'](.*)["']$/, '$1');
				source = ImportPathHelpers.getImportPathRelativeToFile(source, relativeTo);
				return {
					path: source,
					pathInApp: ImportPathHelpers.getAppRelativeImportPath(source),
					originalPath,
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
		const wrappedParser = profileFunction('plugin: postcss: css-modules-loader-core', function (css, result) {
			return parser.plugin(css, result);
		});
		// const processor = postcss(postcssPlugins.concat([parser.plugin]));
		const processor = postcss(postcssPlugins.concat([wrappedParser]));
		return processor.process(sourceString, {
			from: sourcePath,
			to: getOutputPath(sourcePath, pluginOptions.outputCssFilePath),
			map: { inline: false },
			parser: pluginOptions.parser ? Npm.require(pluginOptions.parser) : undefined
		})
			.then(result => {
				let exportTokens = parser.exportTokens;
				console.log('tokens', JSON.stringify(exportTokens, null, 2))
				if (pluginOptions.jsClassNamingConvention.camelCase) {
					let transformedTokens = {};
					let keys = Object.keys(exportTokens);
					keys.forEach(key=>transformedTokens[camelcase(key)]=exportTokens[key]);
					exportTokens = transformedTokens;
				}
				return {injectableSource: result.css, exportTokens, sourceMap: result.map.toJSON()};
			});
	}

};
