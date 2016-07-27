# Change Log
All notable changes to this project will be documented in this file (starting from version 2.0.0).
This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

## [2.1.2] - 2016-07-22
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

[Unreleased]: https://github.com/nathantreid/meteor-css-modules/compare/v2.1.2...HEAD
[2.1.2]: https://github.com/nathantreid/meteor-css-modules/compare/v2.1.1...v2.1.2
[2.1.1]: https://github.com/nathantreid/meteor-css-modules/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/nathantreid/meteor-css-modules/compare/v2.0.2...v2.1.0
[2.0.2]: https://github.com/nathantreid/meteor-css-modules/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/nathantreid/meteor-css-modules/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/nathantreid/meteor-css-modules/compare/v1.3.0...v2.0.0
[1.3.0]: https://github.com/nathantreid/meteor-css-modules/compare/v1.1.2...v1.3.0
[the wiki]: https://github.com/nathantreid/meteor-css-modules/wiki
