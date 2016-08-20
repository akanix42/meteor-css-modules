/* eslint-env node, mocha */
import ImportPathHelpers from './import-path-helpers';
import chai from 'chai';

chai.should();

describe('ImportPathHelpers', function() {
  describe('getAbsoluteImportPath', function() {
    it('should return the input path if the input is absolute', function z() {
      const inputPath = 'C:/test';
      const outputPath = ImportPathHelpers.getAbsoluteImportPath(inputPath);
      outputPath.should.equal(inputPath);
    });

    it('should return an absolute path if the input is relative', function z() {
      const inputPath = 'test';
      ImportPathHelpers.basePath = 'C:/';
      const outputPath = ImportPathHelpers.getAbsoluteImportPath(inputPath);
      outputPath.should.equal('C:/test');
    });

    it('should convert backslashes to forward slashes', function z() {
      const inputPath = 'C:\\test';
      const outputPath = ImportPathHelpers.getAbsoluteImportPath(inputPath);
      outputPath.should.equal('C:/test');
    });
  });

  describe('getAppRelativeImportPath', function() {
    it('should return the input path as an "absolute" path with the app base path as the root', function z() {
      const inputPath = 'C:/test/hello';
      ImportPathHelpers.basePath = 'C:/test';
      const outputPath = ImportPathHelpers.getAppRelativeImportPath(inputPath);
      outputPath.should.equal('/hello');
    });
  });

  describe('getImportPathRelativeToFile', function() {
    it('should return absolute path when supplied absolute path', function z() {
      const inputPath = 'C:/test/hello';
      const relativeTo = 'C:/test/other';
      ImportPathHelpers.basePath = 'C:/test';
      const outputPath = ImportPathHelpers.getImportPathRelativeToFile(inputPath, relativeTo);
      outputPath.should.equal('C:/test/hello');
    });

    it('should return absolute path to file in same directory', function z() {
      const inputPath = './hello';
      const relativeTo = 'C:/test/other';
      ImportPathHelpers.basePath = 'C:/test';
      const outputPath = ImportPathHelpers.getImportPathRelativeToFile(inputPath, relativeTo);
      outputPath.should.equal('C:/test/hello');
    });

    it('should return absolute path to file in same directory without ./', function z() {
      const inputPath = 'hello';
      const relativeTo = 'C:/test/other';
      ImportPathHelpers.basePath = 'C:/test';
      const outputPath = ImportPathHelpers.getImportPathRelativeToFile(inputPath, relativeTo);
      outputPath.should.equal('C:/test/hello');
    });

    it('should return absolute path to file in parent directory', function z() {
      const inputPath = '../hello';
      const relativeTo = 'C:/test/other';
      ImportPathHelpers.basePath = 'C:/test';
      const outputPath = ImportPathHelpers.getImportPathRelativeToFile(inputPath, relativeTo);
      outputPath.should.equal('C:/hello');
    });

    it('should return absolute path to file in child directory', function z() {
      const inputPath = './world/hello';
      const relativeTo = 'C:/test/other';
      ImportPathHelpers.basePath = 'C:/test';
      const outputPath = ImportPathHelpers.getImportPathRelativeToFile(inputPath, relativeTo);
      outputPath.should.equal('C:/test/world/hello');
    });

    it('should return absolute path to node modules file', function z() {
      const inputPath = '~world/hello';
      const relativeTo = 'C:/test/other';
      ImportPathHelpers.basePath = 'C:/test';
      const outputPath = ImportPathHelpers.getImportPathRelativeToFile(inputPath, relativeTo);
      outputPath.should.equal('C:/test/node_modules/world/hello');
    });

    it('should return absolute path to curly-syntax non-package path', function z() {
      const inputPath = '{}/world/hello';
      const relativeTo = 'C:/test/other';
      ImportPathHelpers.basePath = 'C:/test';
      const outputPath = ImportPathHelpers.getImportPathRelativeToFile(inputPath, relativeTo);
      outputPath.should.equal('C:/test/world/hello');
    });

    it('should return absolute path to curly-syntax package path without colon', function z() {
      const inputPath = '{my_package}/world/hello';
      const relativeTo = 'C:/test/other';
      ImportPathHelpers.basePath = 'C:/test';
      const outputPath = ImportPathHelpers.getImportPathRelativeToFile(inputPath, relativeTo);
      outputPath.should.equal('C:/test/packages/my_package/world/hello');
    });

    it('should return absolute path to curly-syntax package path without colon', function z() {
      const inputPath = '{my:package}/world/hello';
      const relativeTo = 'C:/test/other';
      ImportPathHelpers.basePath = 'C:/test';
      const outputPath = ImportPathHelpers.getImportPathRelativeToFile(inputPath, relativeTo);
      outputPath.should.equal('C:/test/packages/my_package/world/hello');
    });
  });
});
