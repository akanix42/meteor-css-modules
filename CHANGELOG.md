# Change Log
All notable changes to this project will be documented in this file (starting from version 2.0.0).
This project adheres to [Semantic Versioning](http://semver.org/).

## [2.5.4] - 2017-05-17
### Fixed
 - npm package in node_modules are now lazy loaded (no more red backgrounds after installing node-sass!) (#84)
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

[Unreleased]: https://github.com/nathantreid/meteor-css-modules/compare/v2.5.4...HEAD
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
