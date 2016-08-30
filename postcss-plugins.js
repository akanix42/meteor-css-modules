import pluginOptionsWrapper from './options';
let pluginOptions = pluginOptionsWrapper.options;
import fs from 'fs';
import cjson from 'cjson';
import path from 'path';
import R from 'ramda';
import ImportPathHelpers from './helpers/import-path-helpers';

const corePlugins = {
  'postcss-modules-local-by-default': require('postcss-modules-local-by-default'),
  'postcss-modules-extract-imports': require('postcss-modules-extract-imports'),
  'postcss-modules-scope': require('postcss-modules-scope'),
  'postcss-modules-values': require('postcss-modules-values'),
};

corePlugins['postcss-modules-scope'].generateScopedName = function generateScopedName(exportedName, filePath) {
  let sanitisedPath = path.relative(ImportPathHelpers.basePath, filePath).replace(/.*\{}[/\\]/, '').replace(/.*\{.*?}/, 'packages').replace(/\.[^\.\/\\]+$/, '').replace(/[\W_]+/g, '_').replace(/^_|_$/g, '');
  const filename = path.basename(filePath).replace(/\.[^\.\/\\]+$/, '').replace(/[\W_]+/g, '_').replace(/^_|_$/g, '');
  sanitisedPath = sanitisedPath.replace(new RegExp(`_(${filename})$`), '__$1');
  return runReplacers(`_${sanitisedPath}__${exportedName}`);
};

function runReplacers(name) {
  if (!pluginOptions.cssClassNamingConvention || !pluginOptions.cssClassNamingConvention.replacements ||
    pluginOptions.cssClassNamingConvention.replacements.length === 0) {
    return name;
  }

  let trimmed = name;
  for (let replacer of pluginOptions.cssClassNamingConvention.replacements) {
    trimmed = replacer(trimmed);
  }
  return trimmed;
}

export default loadPlugins;

function loadPlugins(options) {
  pluginOptions = options;

  const defaultOptions = {
    'postcss-modules-local-by-default': {},
    'postcss-modules-extract-imports': {},
    'postcss-modules-scope': {},
    'postcss-modules-values': {}
  };
  const postcssPluginsOptions = options.postcssPlugins || defaultOptions;
  const plugins = [];

  R.forEach((pluginEntry) => {
    const packageName = pluginEntry[0];
    let plugin = corePlugins[packageName] || require(packageName);
    if (plugin === undefined) throw new Error(`plugin ${packageName} was not found by NPM!`);

    var pluginEntryOptions = pluginEntry[1];
    if (options.globalVariablesJs && packageName === 'postcss-simple-vars') {
      pluginEntryOptions = R.merge({ variables: options.globalVariablesJs }, pluginEntryOptions);
    }

    plugin = pluginEntryOptions !== undefined ? plugin(pluginEntryOptions) : plugin;
    plugins.push(plugin);
  }, R.toPairs(postcssPluginsOptions));
  return plugins;
}
