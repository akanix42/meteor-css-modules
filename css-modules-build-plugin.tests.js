/* eslint-env node, mocha */
import './test-helpers/import-path-helpers.stub';
import chai from 'chai';
import ImportPathHelpers from './helpers/import-path-helpers';
import mock from 'mock-require';
import generateFileObject from './test-helpers/generate-file-object';
import { reloadOptions } from './options';
import Fiber from 'fibers';
import Future from 'fibers/future';

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
    it('should cache the plugin options', function z() {

    });

    it('should remove files from excluded folders', function z(done) {
      const originalFiles = [
        generateFileObject('./test.css'),
        generateFileObject('./yellow.css'),
        generateFileObject('./red.css'),
      ];

      MultiFileCachingCompiler.prototype.processFilesForTarget = function(files) {
        expect(files.length).to.equal(2);
        expect(files[0]).to.equal(originalFiles[0]);
        expect(files[1]).to.equal(originalFiles[2]);
        done();
      };

      const processor = new CssModulesBuildPlugin();
      processor.reloadOptions = () => ({ ...reloadOptions(), ignorePaths: ['yellow'] });
      processor.processFilesForTarget(originalFiles);
    });

    it('should add files from explicitly included folders', function z(done) {
      Fiber(function() {
        const originalFiles = [
          generateFileObject('./test.css'),
          generateFileObject('./yellow.css'),
        ];

        MultiFileCachingCompiler.prototype.processFilesForTarget = function(files) {
          expect(files.length).to.equal(4);
          expect(files[0]).to.equal(originalFiles[0]);
          expect(files[1]).to.equal(originalFiles[1]);
          expect(files[2].path).to.equal('test-helpers/explicit-includes/a.css');
          expect(files[3].path).to.equal('test-helpers/explicit-includes/b.css');
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
});
