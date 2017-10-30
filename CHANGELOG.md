# Change Log
All notable changes to this project will be documented in this file (starting from version 2.0.0).
This project adheres to [Semantic Versioning](http://semver.org/).

## [2.8.0] - 2017-10-30
### Fixed
 - Support for Meteor 1.6!

## [2.7.4] - 2017-09-07
### Fixed
 - Multi-dot file extensions now work with the `enableSassCompilation` option

## [2.7.3] - 2017-05-31
### Fixed
 - Replaced reference to remove function `_updateFilesByName`.

## [2.7.2] - 2017-05-31
### Fixed
 - Importing files before they have been processed separately no longer results in an error (#101).

## [2.7.1] - 2017-05-18
### Fixed
 - Importing SASS files via absolute paths (e.g. `@import '/imports/file.scss';`) is now working (instead of causing a silent crash).

## [2.7.0] - 2017-05-18
### Added
 - Support for custom CSS class naming templates. This allows you to easily customize the generated CSS names to be anything you want, including built-in support for hashed classes. See [the docs](https://github.com/nathantreid/meteor-css-modules/wiki/Custom-CSS-Class-Names) for more info.

## [2.6.0] - 2017-05-17
### Fixed
 - Files within NPM package docs, examples, and tests directories are automatically excluded, as these files aren't intended to be loaded and tend to cause strange errors or crashes. This behavior can be customized via the `defaultIgnorePath` option.
### Added
 - `defaultIgnorePath` option, which defaults to `node_modules/.*/(examples|docs|test|tests)/` (see Fixed section above).
 - `includePaths` option, which takes precedence over the `ignorePaths` option. Uses [json-to-regex](https://www.npmjs.com/package/json-to-regex) for parsing.
### Changed
 - The `ignorePaths` option has been updated to use [json-to-regex](https://www.npmjs.com/package/json-to-regex) for parsing. This doesn't break existing functionality but adds the capability for passing in regex options.
### Deprecated
 - The `explicitIncludes` option has been deprecated. Its primary use was to load files from NPM packages in Meteor 1.2, which is no longer required in Meteor 1.3+.

## [2.5.4] - 2017-05-17
### Fixed
 - NPM packages in node_modules are now lazy loaded (no more red backgrounds after installing node-sass!) (#84)
 - Importing files that meteor hasn't already picked up will no longer lock up the build process (#100)
 - When importing a file that has been ignored, it will no longer be read from disk if Meteor has already loaded the file (#100)
 - SSR no longer breaks on lazy-loaded files that are used on both the web and server architectures (#99)

## [2.5.3] - 2017-03-27
### Fixed
 - stylus processing is working again

## [2.5.2] - 2017-03-27
### Changed
 - node-sass v4.x is now a supported version (no more warnings).

## [2.5.1] - 2017-03-18
### Fixed
 - Removed a leftover console.log statement

## [2.5.0] - 2017-03-18
### Added
 - Integration with akryum:vue-component via nathantreid:vue-css-modules!

## [2.4.0] - 2017-02-22
### Added
 - Support for Less (#78 - thanks @StGeass!)

## [2.3.1] - 2016-11-08
### Fixed
- Published correctly.
### Changed
- Updated Atmosphere package dependencies

## [2.3.0] - 2016-10-15
### Added
- Implemented caching to speed up performance, especially for large projects.

## [2.2.2] - 2016-07-29
### Fixed
- Strip surrounding single quotes when importing CSS modules (previously only stripped double quotes).

## [2.2.1] - 2016-07-29
### Fixed
- Properly override Meteor's default CSS build plugin when using css modules in a package.
- Fix error caused by attempting to load node-sass when scss compilation is enabled but not used.

### Changed
- Increased logging output when profiling is enabled (enableProfiling: true).

## [2.2.0] - 2016-07-29
### Added
- `cssClassNamingConvention.replacements` option allows you to replace any text in the class names. See [the wiki] for more information.
- `jsClassNamingConvention.camelCase` option allows you to convert your css class names to camelCased javasript properties. See [the wiki] for more information.

## [2.1.4] - 2016-07-28
### Changed
- SCSS, Stylus, and CSS modules error logging is more detailed and throws an exception when an error is encountered

## [2.1.3] - 2016-07-26
### Fixed
- Updated to nathantreid:css-modules-import-path-helpers@0.1.4 to fix issues with importing files from Atmosphere packages

## [2.1.2] - 2016-07-26
### Fixed
- When discovering SCSS import paths, don't try to import directories (fixes #61 for local packages)

## [2.1.1] - 2016-07-25
### Fixed
- The passthroughsPaths option preprocesses SCSS / Stylus files but bypasses the PostCSS processor. Allows compilation of libraries such as bootstrap.
- The import path is now always relative to the importing file (fixes #57).

## [2.1.0] - 2016-06-21
### Added
- The .css file extension can now be processed and is enabled by default.
- The new `passthroughPaths` option allows you to skip processing of certain stylesheets, passing them on unchanged to the bundler.
  This allows you exclude CSS modules processing for libraries such as bootstrap. See [the wiki] for more information.

## [2.0.2] - 2016-06-20
### Removed
- A debugging console.log statement

## [2.0.1] - 2016-06-20
### Changed
- Set node-sass dependency to 3.x (accidentally left at =3.4.1 from testing)

## [2.0.0] - 2016-06-20
### Added
- Changelog file is now included in the repo

### Changed
- node-sass, stylus, and sugarss are now user installed dependencies; they are still supported, but the npm packages are no longer bundled with the CSS modules package.
They must now be installed using `meteor npm install`.
Once installed, their behavior is unchanged: Sass and Stylus compilation require the `extensions` property to be set, and sugarss requires the `parser` option to be set.
See [the wiki] for more details.
- Stylus now supports both .styl and m.styl extensions by default (the previous default was m.styl)

[Unreleased]: https://github.com/nathantreid/meteor-css-modules/compare/v2.8.0...HEAD
[2.8.0]: https://github.com/nathantreid/meteor-css-modules/compare/v2.7.4...v2.8.0
[2.7.4]: https://github.com/nathantreid/meteor-css-modules/compare/v2.7.3...v2.7.4
[2.7.3]: https://github.com/nathantreid/meteor-css-modules/compare/v2.7.2...v2.7.3
[2.7.2]: https://github.com/nathantreid/meteor-css-modules/compare/v2.7.1...v2.7.2
[2.7.1]: https://github.com/nathantreid/meteor-css-modules/compare/v2.7.0...v2.7.1
[2.7.0]: https://github.com/nathantreid/meteor-css-modules/compare/v2.6.0...v2.7.0
[2.6.0]: https://github.com/nathantreid/meteor-css-modules/compare/v2.5.4...v2.6.0
[2.5.4]: https://github.com/nathantreid/meteor-css-modules/compare/v2.5.3...v2.5.4
[2.5.3]: https://github.com/nathantreid/meteor-css-modules/compare/v2.5.2...v2.5.3
[2.5.2]: https://github.com/nathantreid/meteor-css-modules/compare/v2.5.1...v2.5.2
[2.5.1]: https://github.com/nathantreid/meteor-css-modules/compare/v2.5.0...v2.5.1
[2.5.0]: https://github.com/nathantreid/meteor-css-modules/compare/v2.4.0...v2.5.0
[2.4.0]: https://github.com/nathantreid/meteor-css-modules/compare/v2.3.1...v2.4.0
[2.3.1]: https://github.com/nathantreid/meteor-css-modules/compare/v2.3.0...v2.3.1
[2.3.0]: https://github.com/nathantreid/meteor-css-modules/compare/v2.2.2...v2.3.0
[2.2.2]: https://github.com/nathantreid/meteor-css-modules/compare/v2.2.1...v2.2.2
[2.2.1]: https://github.com/nathantreid/meteor-css-modules/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/nathantreid/meteor-css-modules/compare/v2.1.4...v2.2.0
[2.1.4]: https://github.com/nathantreid/meteor-css-modules/compare/v2.1.3...v2.1.4
[2.1.3]: https://github.com/nathantreid/meteor-css-modules/compare/v2.1.2...v2.1.3
[2.1.2]: https://github.com/nathantreid/meteor-css-modules/compare/v2.1.1...v2.1.2
[2.1.1]: https://github.com/nathantreid/meteor-css-modules/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/nathantreid/meteor-css-modules/compare/v2.0.2...v2.1.0
[2.0.2]: https://github.com/nathantreid/meteor-css-modules/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/nathantreid/meteor-css-modules/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/nathantreid/meteor-css-modules/compare/v1.3.0...v2.0.0
[1.3.0]: https://github.com/nathantreid/meteor-css-modules/compare/v1.1.2...v1.3.0
[the wiki]: https://github.com/nathantreid/meteor-css-modules/wiki
