/* eslint-env node, mocha */
import checkNpmPackage from './check-npm-package';
import chai from 'chai';
import logger from './logger';

const expect = chai.expect;

describe('checkNpmPackage', function() {
  it('should return false if the package is not installed', function() {
    logger.test(function() {
      expect(checkNpmPackage('fake-package')).to.be.false;
    });
  });

  it('should output an error if the package is not installed', function(done) {
    logger.test(function() {
      let receivedErrorMessage = '';
      logger.error.addHook(errorMessage => {
        try {
          receivedErrorMessage += errorMessage + '\n';
          return false;
        } catch (e) {
          done(e);
        }
      });

      checkNpmPackage('fake-package@0.0.1');
      expect(receivedErrorMessage).to.have.string('Error checking npm module: fake-package@0.0.1 (required by nathantreid:css-modules): module not found. Please ensure you have installed the module; here is the command:\n meteor npm install fake-package --save-dev\n');
      done();
    });
  });

  it('should return true if an invalid version of the package is installed', function() {
    logger.test(function() {
      expect(checkNpmPackage('eslint@1.0.0')).to.be.true;
    });
  });

  it('should output a warning if an invalid version of the package is installed', function(done) {
    logger.test(function() {
      logger.warn.addHook(errorMessage => {
        try {
          expect(errorMessage).to.have.string('WARNING: version mismatch for eslint; installed version is 3.3.1, but version 1.0.0 is required by nathantreid:css-modules)');
          done();
          return false;
        } catch (e) {
          done(e);
        }
      });

      checkNpmPackage('eslint@1.0.0');
    });
  });

  it('should return true if a matching package version is installed', function() {
    expect(checkNpmPackage('eslint@^3.3.1')).to.be.true;
  });
});
