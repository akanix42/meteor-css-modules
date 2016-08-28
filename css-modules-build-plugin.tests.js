/* eslint-env node, mocha */
import './test-helpers/global-variables.stub';
import './test-helpers/import-path-helpers.stub';
import chai from 'chai';
// import CssModulesBuildPlugin from './css-modules-build-plugin';
// import { reloadOptions } from './options';
import ImportPathHelpers from './helpers/import-path-helpers';
// import path from 'path';
// import logger from './logger';
import mock from 'mock-require';
import generateFileObject from './test-helpers/generate-file-object';
import { reloadOptions } from './options';
import Fiber from 'fibers';
import Future from 'fibers/future';
import ScssProcessor from './scss-processor';
import CssModulesProcessor from './css-modules-processor';
import { stripIndent } from 'common-tags';

const expect = chai.expect;

mock('meteor/meteor', {
  Meteor: {
    wrapAsync(fn) {
      return function(...args) {
        const future = new Future();
        fn(...args, function(err, result) {
          if (err) {
            future.throw(err);
          } else {
            future.return(result);
          }
        });
        return future.wait();
      };
    }
  }
});

const MockBabel = { compile: (code) => ({ code }) };
mock('meteor/babel-compiler', { Babel: MockBabel });

import { MultiFileCachingCompiler } from './test-helpers/multi-file-caching-compiler';
mock('meteor/caching-compiler', { MultiFileCachingCompiler });

const CssModulesBuildPlugin = require('./css-modules-build-plugin').default;

describe('CssModulesBuildPlugin', function() {
  describe('#isRoot', function() {
    it('should return true when there are no preprocessors ', function z() {
      const buildPlugin = new CssModulesBuildPlugin();
      buildPlugin.preprocessors = [];

      expect(buildPlugin.isRoot({})).to.be.true;
    });

    it('should pass the input file argument to preprocessors[]#shouldProcess', function z() {
      const buildPlugin = new CssModulesBuildPlugin();
      let arg;
      const file = {};
      buildPlugin.preprocessors = [
        {
          shouldProcess(file) {
            arg = file;
          }
        },
      ];
      buildPlugin.isRoot(file);

      expect(arg).to.equal(file);
    });

    it('should pass the input file argument to preprocessors[]#isRoot', function z() {
      const buildPlugin = new CssModulesBuildPlugin();
      let arg;
      const file = {};
      buildPlugin.preprocessors = [
        {
          shouldProcess: returnsTrue,
          isRoot(file) {
            arg = file;
          }
        },
      ];
      buildPlugin.isRoot(file);

      expect(arg).to.equal(file);
    });

    it('should return true when preprocessors[]#shouldProcess returns false', function z() {
      const buildPlugin = new CssModulesBuildPlugin();
      buildPlugin.preprocessors = [
        { shouldProcess: returnsFalse },
        { shouldProcess: returnsFalse },
        { shouldProcess: returnsFalse },
      ];

      expect(buildPlugin.isRoot({})).to.be.true;
    });

    it('should return false when preprocessors[]#shouldProcess returns true and preprocessors[]#isRoot returns false', function z() {
      const buildPlugin = new CssModulesBuildPlugin();
      buildPlugin.preprocessors = [
        { shouldProcess: returnsTrue, isRoot: returnsFalse },
        { shouldProcess: returnsTrue, isRoot: returnsFalse },
        { shouldProcess: returnsTrue, isRoot: returnsFalse },
      ];

      expect(buildPlugin.isRoot({})).to.be.false;
    });

    it('should return true when preprocessors[]#shouldProcess returns true and preprocessors[]#isRoot returns true', function z() {
      const buildPlugin = new CssModulesBuildPlugin();
      buildPlugin.preprocessors = [
        { shouldProcess: returnsTrue, isRoot: returnsFalse },
        { shouldProcess: returnsTrue, isRoot: returnsFalse },
        { shouldProcess: returnsTrue, isRoot: returnsTrue },
      ];

      expect(buildPlugin.isRoot({})).to.be.true;
    });

    it('should not call preprocessors[]#isRoot if preprocessors[]#shouldProcess returns false', function z() {
      const buildPlugin = new CssModulesBuildPlugin();

      let wasIsRootCalled = false;

      function calledIsRoot() {
        wasIsRootCalled = true;
      }

      buildPlugin.preprocessors = [
        { shouldProcess: returnsFalse, isRoot: calledIsRoot },
        { shouldProcess: returnsFalse, isRoot: calledIsRoot },
        { shouldProcess: returnsFalse, isRoot: calledIsRoot },
      ];

      buildPlugin.isRoot({});

      expect(wasIsRootCalled).to.be.false;
    });

    it('should call preprocessors[]#isRoot if preprocessors[]#shouldProcess returns true', function z() {
      const buildPlugin = new CssModulesBuildPlugin();

      let isRootCalledCount = 0;

      function calledIsRoot() {
        isRootCalledCount++;
      }

      buildPlugin.preprocessors = [
        { shouldProcess: returnsTrue, isRoot: calledIsRoot },
        { shouldProcess: returnsTrue, isRoot: calledIsRoot },
        { shouldProcess: returnsTrue, isRoot: calledIsRoot },
      ];

      buildPlugin.isRoot({});

      expect(isRootCalledCount).to.equal(3);
    });

    it('should call all preprocessors[]#shouldProcess when preprocessors[]#shouldProcess or #isRoot return false', function z() {
      const buildPlugin = new CssModulesBuildPlugin();
      let callCount = 0;

      function incrementCallCount(result = false) {
        if (typeof result !== 'boolean') {
          result = false;
        }

        callCount++;
        return result;
      }

      buildPlugin.preprocessors = [
        { shouldProcess: incrementCallCount },
        { shouldProcess: () => incrementCallCount(true), isRoot: () => incrementCallCount(false) },
        { shouldProcess: incrementCallCount },
      ];
      buildPlugin.isRoot({});
      expect(callCount).to.equal(4);
    });

    it('should call all preprocessors[]#isRoot when preprocessors[]#shouldProcess returns true and preprocessors[]#isRoot returns false', function z() {
      const buildPlugin = new CssModulesBuildPlugin();
      let callCount = 0;

      function incrementCallCount() {
        callCount++;
        return false;
      }

      buildPlugin.preprocessors = [
        { shouldProcess: returnsTrue, isRoot: incrementCallCount },
        { shouldProcess: returnsTrue, isRoot: incrementCallCount },
        { shouldProcess: returnsTrue, isRoot: incrementCallCount },
      ];
      buildPlugin.isRoot({});
      expect(callCount).to.equal(3);
    });

    it('should stop calling preprocessors[]#shouldProcess when preprocessors[]#isRoot returns true', function z() {
      const buildPlugin = new CssModulesBuildPlugin();

      const calledIsRootList = [false, false, false];

      function calledIsRoot(index, result = false) {
        calledIsRootList[index] = true;
        return result;
      }

      buildPlugin.preprocessors = [
        { shouldProcess: returnsTrue, isRoot: () => calledIsRoot(0, false) },
        { shouldProcess: returnsTrue, isRoot: () => calledIsRoot(1, true) },
        { shouldProcess: returnsTrue, isRoot: () => calledIsRoot(2, true) },
      ];

      buildPlugin.isRoot({});

      expect(calledIsRootList).to.eql([true, true, false]);
    });
  });

  describe('#compileResultSize', function() {
    it('should return the length of the stringified compile result', function z() {
      const buildPlugin = new CssModulesBuildPlugin();

      expect(buildPlugin.compileResultSize({})).to.equal(2);
      expect(buildPlugin.compileResultSize({ test: 1 })).to.equal(10);
    });
  });

  describe('#getCacheKey', function() {
    it('should return the inputFile`s source hash combined with the plugin options hash', function z() {
      const pluginOptions = reloadOptions();
      const buildPlugin = new CssModulesBuildPlugin();
      buildPlugin.optionsHash = pluginOptions.hash;
      const result = `${pluginOptions.hash}...test`;
      const sourceHash = 'test';
      const file = { getSourceHash: () => sourceHash };

      expect(buildPlugin.getCacheKey(file)).to.equal(result);
    });
  });

  describe('#getAbsoluteImportPath', function() {
    it('should return the inputFile`s importPath as calculated by ImportPathHelpers', function z() {
      const buildPlugin = new CssModulesBuildPlugin();
      const file = generateFileObject('./test.css');
      const result = `${ImportPathHelpers.basePath.replace(/\\/g, '/')}/test.css`;

      expect(buildPlugin.getAbsoluteImportPath(file)).to.equal(result);
    });
  });

  describe('#processFilesForTarget', function() {
    it('should store the plugin options hash', function z() {
      const pluginOptions = reloadOptions();
      const buildPlugin = new CssModulesBuildPlugin();
      buildPlugin.processFilesForTarget([]);
      expect(buildPlugin.optionsHash).to.equal(pluginOptions.hash);
    });

    it('should pass the files array to MultiFileCachingCompiler#processFilesForTarget', function z(done) {
      const filesToProcess = [];
      const processFilesForTarget = MultiFileCachingCompiler.prototype.processFilesForTarget;
      MultiFileCachingCompiler.prototype.processFilesForTarget = function(files) {
        expect(files).to.equal(filesToProcess);

        MultiFileCachingCompiler.prototype.processFilesForTarget = processFilesForTarget;
        done();
      };
      const buildPlugin = new CssModulesBuildPlugin();
      buildPlugin.processFilesForTarget(filesToProcess);
    });

    it('should reset the filesByName property', function z(done) {
      const processFilesForTarget = MultiFileCachingCompiler.prototype.processFilesForTarget;
      MultiFileCachingCompiler.prototype.processFilesForTarget = function() {
        expect(this.filesByName).to.be.null;

        MultiFileCachingCompiler.prototype.processFilesForTarget = processFilesForTarget;
        done();
      };
      const buildPlugin = new CssModulesBuildPlugin();
      buildPlugin.filesByName = [];
      buildPlugin.processFilesForTarget([]);
    });

    describe('ignorePaths', function() {
      it('should remove files from excluded folders', function z(done) {
        const originalFiles = [
          generateFileObject('./test.css'),
          generateFileObject('./yellow.css'),
          generateFileObject('./red.css'),
        ];

        const processFilesForTarget = MultiFileCachingCompiler.prototype.processFilesForTarget;
        MultiFileCachingCompiler.prototype.processFilesForTarget = function(files) {
          expect(files.length).to.equal(2);
          expect(files[0]).to.equal(originalFiles[0]);
          expect(files[1]).to.equal(originalFiles[2]);

          MultiFileCachingCompiler.prototype.processFilesForTarget = processFilesForTarget;
          done();
        };

        const buildPlugin = new CssModulesBuildPlugin();
        buildPlugin.reloadOptions = () => ({ ...reloadOptions(), ignorePaths: ['yellow'] });
        buildPlugin.processFilesForTarget(originalFiles);
      });
    });

    describe('explicitIncludes', function() {
      it('should add files from explicitly included folders', function z(done) {
        Fiber(function() {
          const originalFiles = [
            generateFileObject('./test.css'),
            generateFileObject('./yellow.css'),
          ];

          const processFilesForTarget = MultiFileCachingCompiler.prototype.processFilesForTarget;
          MultiFileCachingCompiler.prototype.processFilesForTarget = function(files) {
            expect(files.length).to.equal(4);
            expect(files[0]).to.equal(originalFiles[0]);
            expect(files[1]).to.equal(originalFiles[1]);
            const newFiles = files.slice(2);
            newFiles.sort(function(a, b) {
              if (a.path < b.path) return -1;
              if (a.path > b.path) return 1;
              return 0;
            });
            expect(newFiles[0].path).to.equal('test-helpers/explicit-includes/a.css');
            expect(newFiles[1].path).to.equal('test-helpers/explicit-includes/b.css');

            MultiFileCachingCompiler.prototype.processFilesForTarget = processFilesForTarget;
            done();
          };

          const buildPlugin = new CssModulesBuildPlugin();
          buildPlugin.reloadOptions = () => ({
            ...reloadOptions(),
            explicitIncludes: ['./test-helpers/explicit-includes']
          });
          buildPlugin.processFilesForTarget(originalFiles);
        }).run();
      });
    });

    describe('scss preprocessor', function() {
      it('should not setup the scss preprocessor when enableSassCompilation is false', function z() {
        const buildPlugin = new CssModulesBuildPlugin();
        buildPlugin.reloadOptions = () => ({ ...reloadOptions(), enableSassCompilation: false });
        buildPlugin.processFilesForTarget([]);

        expect(buildPlugin.preprocessors.length).to.equal(0);
      });

      it('should not setup the scss preprocessor when enableSassCompilation is falsy', function z() {
        const buildPlugin = new CssModulesBuildPlugin();
        buildPlugin.reloadOptions = () => ({ ...reloadOptions(), enableSassCompilation: null });
        buildPlugin.processFilesForTarget([]);

        expect(buildPlugin.preprocessors.length).to.equal(0);
      });

      it('should setup the scss preprocessor when enableSassCompilation is true', function z() {
        const buildPlugin = new CssModulesBuildPlugin();
        buildPlugin.reloadOptions = () => ({ ...reloadOptions(), enableSassCompilation: true });
        buildPlugin.processFilesForTarget([]);

        expect(buildPlugin.preprocessors[0]).to.be.an.instanceOf(ScssProcessor);
      });

      it('should setup the scss preprocessor when enableSassCompilation is truthy', function z() {
        const buildPlugin = new CssModulesBuildPlugin();
        buildPlugin.reloadOptions = () => ({ ...reloadOptions(), enableSassCompilation: [] });
        buildPlugin.processFilesForTarget([]);

        expect(buildPlugin.preprocessors[0]).to.be.an.instanceOf(ScssProcessor);
      });
    });

    describe('css modules processor', function() {
      it('should set up the cssModulesProcessor', function z() {
        const buildPlugin = new CssModulesBuildPlugin();
        buildPlugin.processFilesForTarget([]);

        expect(buildPlugin.cssModulesProcessor).to.be.an.instanceOf(CssModulesProcessor);
      });
    });
  });

  describe('#compileOneFile', function() {
    describe('.compileResult', function() {
      describe('stylesheet', function() {
        it('should return stylesheet code for web architecture', function z(done) {
          Fiber(function() {
            const file = generateFileObject('./test.css', '.test { color: red; }');
            const cssModulesProcessor = { process: noop };
            const buildPlugin = new CssModulesBuildPlugin();
            buildPlugin.cssModulesProcessor = cssModulesProcessor;
            buildPlugin.preprocessors = [];
            buildPlugin.filesByName = new Map();

            const result = buildPlugin.compileOneFile(file);

            expect(result.compileResult.stylesheet).to.equal('.test { color: red; }');
            done();
          }).run();
        });

        it('should not return stylesheet code for lazy-loaded files', function z(done) {
          Fiber(function() {
            const file = generateFileObject('./imports/test.css', '.test { color: red; }');

            const cssModulesProcessor = { process: noop };
            const buildPlugin = new CssModulesBuildPlugin();
            buildPlugin.cssModulesProcessor = cssModulesProcessor;
            buildPlugin.preprocessors = [];
            buildPlugin.filesByName = new Map();

            const result = buildPlugin.compileOneFile(file);

            expect('stylesheet' in result.compileResult).to.be.false;
            done();
          }).run();
        });

        it('should not return stylesheet code for server architecture', function z(done) {
          Fiber(function() {
            const file = generateFileObject('./test.css', '.test { color: red; }');
            file.arch = 'server';

            const cssModulesProcessor = { process: noop };
            const buildPlugin = new CssModulesBuildPlugin();
            buildPlugin.cssModulesProcessor = cssModulesProcessor;
            buildPlugin.preprocessors = [];
            buildPlugin.filesByName = new Map();

            const result = buildPlugin.compileOneFile(file);

            expect('stylesheet' in result.compileResult).to.be.false;
            done();
          }).run();
        });
      });

      describe('javascript', function() {
        it('should include the javascript class mappings', function z(done) {
          Fiber(function() {
            const file = generateFileObject('./test.css', '.test { color: red; }');
            file.tokens = { 'test': 'TEST' };
            const cssModulesProcessor = { process: noop };
            const buildPlugin = new CssModulesBuildPlugin();
            buildPlugin.cssModulesProcessor = cssModulesProcessor;
            buildPlugin.preprocessors = [];
            buildPlugin.filesByName = new Map();

            const result = buildPlugin.compileOneFile(file);

            expect(result.compileResult.javascript).to.equal(stripIndent`
                const styles = {"test":"TEST"};
                export { styles as default, styles };
                `);
            done();
          }).run();
        });

        it('should include module imports for imported files', function z(done) {
          Fiber(function() {
            const file = generateFileObject('./test.css', '.test { color: red; }');
            file.imports = ['./a.css', './b/b.css'];
            const cssModulesProcessor = { process: noop };
            const buildPlugin = new CssModulesBuildPlugin();
            buildPlugin.cssModulesProcessor = cssModulesProcessor;
            buildPlugin.preprocessors = [];
            buildPlugin.filesByName = new Map();

            const result = buildPlugin.compileOneFile(file);

            expect(result.compileResult.javascript).to.equal(stripIndent`
                import './a.css';
                import './b/b.css';
                `);
            done();
          }).run();
        });

        it('should include the stylesheet for lazy-loaded files', function z(done) {
          Fiber(function() {
            const file = generateFileObject('./imports/test.css', '.test { color: red; }');
            const cssModulesProcessor = { process: noop };
            const buildPlugin = new CssModulesBuildPlugin();
            buildPlugin.cssModulesProcessor = cssModulesProcessor;
            buildPlugin.preprocessors = [];
            buildPlugin.filesByName = new Map();

            const result = buildPlugin.compileOneFile(file);

            expect(result.compileResult.javascript).to.equal(stripIndent`
                import modules from 'meteor/modules';
                modules.addStyles(".test { color: red; }");
                `);
            done();
          }).run();
        });

        it('should include the module imports, stylesheet, and class mapping when applicable', function z(done) {
          Fiber(function() {
            const file = generateFileObject('./imports/test.css', '.test { color: red; }');
            file.tokens = { 'test': 'TEST' };
            file.imports = ['./a.css', './b/b.css'];
            const cssModulesProcessor = { process: noop };
            const buildPlugin = new CssModulesBuildPlugin();
            buildPlugin.cssModulesProcessor = cssModulesProcessor;
            buildPlugin.preprocessors = [];
            buildPlugin.filesByName = new Map();

            const result = buildPlugin.compileOneFile(file);

            expect(result.compileResult.javascript).to.equal(stripIndent`
                import './a.css';
                import './b/b.css';
                import modules from 'meteor/modules';
                modules.addStyles(".test { color: red; }");
                const styles = {"test":"TEST"};
                export { styles as default, styles };
                `
            );
            done();
          }).run();
        });
      });
    });

    describe('.referencedImportPaths', function() {
      it('should return the referencedImportPaths', function z(done) {
        Fiber(function() {
          const file = generateFileObject('./test.css', '.test { color: red; }');
          file.referencedImportPaths = [];
          const cssModulesProcessor = { process: noop };
          const buildPlugin = new CssModulesBuildPlugin();
          buildPlugin.cssModulesProcessor = cssModulesProcessor;
          buildPlugin.preprocessors = [];
          buildPlugin.filesByName = new Map();

          const result = buildPlugin.compileOneFile(file);

          expect(result.referencedImportPaths).to.equal(file.referencedImportPaths);
          done();
        }).run();
      });
    });

    describe('css modules processor', function() {
      it('should process the files through the css modules processor', function z(done) {
        Fiber(function() {
          const file = generateFileObject('./test.css');

          const cssModulesProcessor = {
            process(fileArg) {
              expect(fileArg).to.equal(file);
              done();
            }
          };
          const buildPlugin = new CssModulesBuildPlugin();
          buildPlugin.cssModulesProcessor = cssModulesProcessor;
          buildPlugin.preprocessors = [];
          buildPlugin.filesByName = new Map();
          buildPlugin.compileOneFile(file);
        }).run();
      });
    });

    describe('preprocessor', function() {
      it('should run the files through any matching preprocessors', function z(done) {
        Fiber(function() {
          const file = generateFileObject('./test.css');

          let error;
          let numberOfPreprocessorsCalled = 0;

          const notMatchingPreprocessor1 = {
            shouldProcess: returnsFalse,
            isRoot: returnsFalse,
            process: shouldNotBeCalled,
          };

          const notMatchingPreprocessor2 = {
            shouldProcess: returnsFalse,
            isRoot: returnsFalse,
            process: shouldNotBeCalled,
          };

          const matchingPreprocessor1 = {
            shouldProcess: returnsTrue,
            isRoot: returnsTrue,
            process(fileArg) {
              expect(fileArg).to.equal(file);
              numberOfPreprocessorsCalled++;
            }
          };
          const matchingPreprocessor2 = {
            shouldProcess: returnsTrue,
            isRoot: returnsTrue,
            process(fileArg) {
              expect(fileArg).to.equal(file);
              numberOfPreprocessorsCalled++;
            }
          };

          const cssModulesProcessor = {
            process() {
              expect(numberOfPreprocessorsCalled).to.equal(2);
              done(error);
            }
          };
          const buildPlugin = new CssModulesBuildPlugin();
          buildPlugin.cssModulesProcessor = cssModulesProcessor;
          buildPlugin.preprocessors = [
            notMatchingPreprocessor1,
            matchingPreprocessor1,
            matchingPreprocessor2,
            notMatchingPreprocessor2,
          ];
          buildPlugin.filesByName = new Map();
          buildPlugin.compileOneFile(file);
        }).run();
      });
    });
  });

  describe('#addCompileResult', function() {
    it('should add the stylesheet result', function z() {
      const buildPlugin = new CssModulesBuildPlugin();
      let wasCalled = false;

      const compileResult = {
        stylesheet: {},
        filePath: './test.css',
        sourceMap: { test: true }
      };
      const file = {
        addStylesheet(stylesheet) {
          wasCalled = true;
          expect(stylesheet.data).to.equal(compileResult.stylesheet);
          expect(stylesheet.path).to.equal('./test.css.css');
          expect(stylesheet.sourcePath).to.equal('./test.css.css');
          expect(stylesheet.sourceMap).to.equal(JSON.stringify(compileResult.sourceMap));
          expect(stylesheet.lazy).to.be.false;
        }
      };
      buildPlugin.addCompileResult(file, compileResult);

      expect(wasCalled).to.be.true;
    });

    it('should add the javascript result', function z() {
      const buildPlugin = new CssModulesBuildPlugin();
      let wasCalled = false;

      const compileResult = {
        javascript: {},
        filePath: './test.css',
        sourceMap: { test: true },
        isLazy: {},
      };
      const file = {
        addJavaScript(javascript) {
          wasCalled = true;
          expect(javascript.data).to.equal(compileResult.javascript);
          expect(javascript.path).to.equal('./test.css.js');
          expect(javascript.sourcePath).to.equal('./test.css');
          expect(javascript.lazy).to.equal(compileResult.isLazy);
          expect(javascript.bare).to.be.false;
        }
      };
      buildPlugin.addCompileResult(file, compileResult);

      expect(wasCalled).to.be.true;
    });
  });
});

function noop() {
}

function returnsFalse() {
  return false;
}

function returnsTrue() {
  return true;
}

function shouldNotBeCalled() {
  throw new Error('This function should not called in the tested execution path!');
}
