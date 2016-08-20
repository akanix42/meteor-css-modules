/* eslint-env node, mocha */
/* globals ImportPathHelpers */
import './test-helpers/import-path-helpers.stub';
import chai from 'chai';
import logger from './logger';
import packageOptionsWrapper, { reloadOptions } from './options';
import cjson from 'cjson';
import path from 'path';

const expect = chai.expect;

cjson._load = cjson.load;
function testCjson(testFunction) {
  testFunction();
  cjson.load = cjson._load;
}

describe('package options', function() {
  before(function() {
    cjson._load = cjson.load;
    cjson.test = (testFunction) => {
      testFunction();
      cjson.load = cjson._load;
    };
  });

  describe('.options', function() {
    it('should contain the options', function z() {
      expect(packageOptionsWrapper.options.test).to.be.true;
    });
  });

  describe('reloadOptions', function() {
    it('should read package.json', function z() {
      testCjson(function() {
        cjson.load = (filePath) => {
          expect(filePath).to.equal(path.join(ImportPathHelpers.basePath, 'package.json'));
          return {};
        };

        reloadOptions();
      });
    });

    it('should reload the options from package.json', function z() {
      packageOptionsWrapper.options.test = false;
      reloadOptions();
      expect(packageOptionsWrapper.options.test).to.be.true;
    });

    it('should merge the default options with the options from package.json', function z() {
      expect(packageOptionsWrapper.options).to.eql({
        cssClassNamingConvention: {
          replacements: []
        },
        enableProfiling: false,
        enableSassCompilation: false,
        enableStylusCompilation: false,
        explicitIncludes: [],
        extensions: ['css', 'm.css', 'mss'],
        filenames: [],
        globalVariablesText: '',
        ignorePaths: [],
        jsClassNamingConvention: {
          camelCase: false
        },
        outputJsFilePath: '{dirname}/{basename}{extname}',
        outputCssFilePath: '{dirname}/{basename}{extname}',
        passthroughPaths: [],
        specificArchitecture: 'web',
        hash: '4ff9a143d6b0b9cc0d90193e6d55cdf6577faf70',
        test: true
      });
    });

    it('should hash the options file', function z() {
      reloadOptions();
      expect(packageOptionsWrapper.options.hash).to.equal('4ff9a143d6b0b9cc0d90193e6d55cdf6577faf70');
      testCjson(function() {
        cjson.load = (filePath) => {
          expect(filePath).to.equal(path.join(ImportPathHelpers.basePath, 'package.json'));
          return { test: false };
        };
        reloadOptions();

        expect(packageOptionsWrapper.options.hash).to.equal('b70a64c10c6426233b51cf8d3162ec604c4614bc');
      });
    });

    /**
     *  TODO: Tests for:
     *  options.cssClassNamingConvention.replacements
     *  options.passthroughPaths
     *  options.enableSassCompilation
     *  options.enableStylusCompilation
     **/
  });
});
