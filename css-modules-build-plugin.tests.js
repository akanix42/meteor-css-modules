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
          shouldProcess: () => true,
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
        { shouldProcess: () => false },
        { shouldProcess: () => false },
        { shouldProcess: () => false },
      ];

      expect(buildPlugin.isRoot({})).to.be.true;
    });

    it('should return false when preprocessors[]#shouldProcess returns true and preprocessors[]#isRoot returns false', function z() {
      const buildPlugin = new CssModulesBuildPlugin();
      buildPlugin.preprocessors = [
        { shouldProcess: () => true, isRoot: () => false },
        { shouldProcess: () => true, isRoot: () => false },
        { shouldProcess: () => true, isRoot: () => false },
      ];

      expect(buildPlugin.isRoot({})).to.be.false;
    });

    it('should return true when preprocessors[]#shouldProcess returns true and preprocessors[]#isRoot returns true', function z() {
      const buildPlugin = new CssModulesBuildPlugin();
      buildPlugin.preprocessors = [
        { shouldProcess: () => true, isRoot: () => false },
        { shouldProcess: () => true, isRoot: () => false },
        { shouldProcess: () => true, isRoot: () => true },
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
        { shouldProcess: () => false, isRoot: calledIsRoot },
        { shouldProcess: () => false, isRoot: calledIsRoot },
        { shouldProcess: () => false, isRoot: calledIsRoot },
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
        { shouldProcess: () => true, isRoot: calledIsRoot },
        { shouldProcess: () => true, isRoot: calledIsRoot },
        { shouldProcess: () => true, isRoot: calledIsRoot },
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
        { shouldProcess: () => true, isRoot: incrementCallCount },
        { shouldProcess: () => true, isRoot: incrementCallCount },
        { shouldProcess: () => true, isRoot: incrementCallCount },
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
        { shouldProcess: () => true, isRoot: () => calledIsRoot(0, false) },
        { shouldProcess: () => true, isRoot: () => calledIsRoot(1, true) },
        { shouldProcess: () => true, isRoot: () => calledIsRoot(2, true) },
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
    it('should return the inputFile`s source hash', function z() {
      const buildPlugin = new CssModulesBuildPlugin();
      const result = 'test';
      const file = { getSourceHash: () => result };

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
      const processor = new CssModulesBuildPlugin();
      processor.processFilesForTarget([]);

      expect(processor.optionsHash).to.equal('4ff9a143d6b0b9cc0d90193e6d55cdf6577faf70');
    });

    it('should pass the files array to MultiFileCachingCompiler#processFilesForTarget', function z(done) {
      const filesToProcess = [];
      const processFilesForTarget = MultiFileCachingCompiler.prototype.processFilesForTarget;
      MultiFileCachingCompiler.prototype.processFilesForTarget = function(files) {
        expect(files).to.equal(filesToProcess);

        MultiFileCachingCompiler.prototype.processFilesForTarget = processFilesForTarget;
        done();
      };
      const processor = new CssModulesBuildPlugin();
      processor.processFilesForTarget(filesToProcess);
    });

    it('should reset the filesByName property', function z(done) {
      const processFilesForTarget = MultiFileCachingCompiler.prototype.processFilesForTarget;
      MultiFileCachingCompiler.prototype.processFilesForTarget = function() {
        expect(this.filesByName).to.be.null;

        MultiFileCachingCompiler.prototype.processFilesForTarget = processFilesForTarget;
        done();
      };
      const processor = new CssModulesBuildPlugin();
      processor.filesByName = [];
      processor.processFilesForTarget([]);
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

        const processor = new CssModulesBuildPlugin();
        processor.reloadOptions = () => ({ ...reloadOptions(), ignorePaths: ['yellow'] });
        processor.processFilesForTarget(originalFiles);
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

          const processor = new CssModulesBuildPlugin();
          processor.reloadOptions = () => ({
            ...reloadOptions(),
            explicitIncludes: ['./test-helpers/explicit-includes']
          });
          processor.processFilesForTarget(originalFiles);
        }).run();
      });
    });

    describe('scss preprocessor', function() {
      it('should not setup the scss preprocessor when enableSassCompilation is false', function z() {
        const processor = new CssModulesBuildPlugin();
        processor.reloadOptions = () => ({ ...reloadOptions(), enableSassCompilation: false });
        processor.processFilesForTarget([]);

        expect(processor.preprocessors.length).to.equal(0);
      });

      it('should not setup the scss preprocessor when enableSassCompilation is falsy', function z() {
        const processor = new CssModulesBuildPlugin();
        processor.reloadOptions = () => ({ ...reloadOptions(), enableSassCompilation: null });
        processor.processFilesForTarget([]);

        expect(processor.preprocessors.length).to.equal(0);
      });

      it('should setup the scss preprocessor when enableSassCompilation is true', function z() {
        const processor = new CssModulesBuildPlugin();
        processor.reloadOptions = () => ({ ...reloadOptions(), enableSassCompilation: true });
        processor.processFilesForTarget([]);

        expect(processor.preprocessors[0]).to.be.an.instanceOf(ScssProcessor);
      });

      it('should setup the scss preprocessor when enableSassCompilation is truthy', function z() {
        const processor = new CssModulesBuildPlugin();
        processor.reloadOptions = () => ({ ...reloadOptions(), enableSassCompilation: [] });
        processor.processFilesForTarget([]);

        expect(processor.preprocessors[0]).to.be.an.instanceOf(ScssProcessor);
      });
    });

    describe('css modules processor', function() {
      it('should set up the cssModulesProcessor', function z() {
        const processor = new CssModulesBuildPlugin();
        processor.processFilesForTarget([]);

        expect(processor.cssModulesProcessor).to.be.an.instanceOf(CssModulesProcessor);
      });
    });
  });

  describe('#compileOneFile', function() {
    describe('compile result', function() {
      it('should return stylesheet code for web architecture', function z(done) {
        Fiber(function() {
          const file = generateFileObject('./test.css', '.test { color: red; }');
          file.arch = 'web';
          const cssModulesProcessor = { process: () => null };
          const processor = new CssModulesBuildPlugin();
          processor.cssModulesProcessor = cssModulesProcessor;
          processor.preprocessors = [];
          processor.filesByName = new Map();

          const result = processor.compileOneFile(file);

          expect(result.compileResult.stylesheet).to.equal('.test { color: red; }');
          done();
        }).run();
      });

      it('should not return stylesheet code for server architecture', function z(done) {
        Fiber(function() {
          const file = generateFileObject('./test.css', '.test { color: red; }');
          file.arch = 'server';

          const cssModulesProcessor = { process: () => null };
          const processor = new CssModulesBuildPlugin();
          processor.cssModulesProcessor = cssModulesProcessor;
          processor.preprocessors = [];
          processor.filesByName = new Map();

          const result = processor.compileOneFile(file);

          expect('stylesheet' in result.compileResult).to.be.false;
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
          const processor = new CssModulesBuildPlugin();
          processor.cssModulesProcessor = cssModulesProcessor;
          processor.preprocessors = [];
          processor.filesByName = new Map();
          processor.compileOneFile(file);
        }).run();
      });
    });

    describe('scss preprocessor', function() {

    });
  });
});
