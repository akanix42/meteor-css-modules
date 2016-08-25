/* eslint-env node, mocha */
import chai from 'chai';
import mock from 'mock-require';

const expect = chai.expect;

mock('meteor/meteor', {
  Meteor: {
    wrapAsync() {
      return {};
    }
  }
});

mock('meteor/caching-compiler', {
  MultiFileCachingCompiler: class MultiFileCachingCompiler {
  }
});

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
});
