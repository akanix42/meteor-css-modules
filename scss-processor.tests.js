/* eslint-env node, mocha */
import './test-helpers/global-variables.stub';
import chai from 'chai';
import ScssProcessor from './scss-processor';
import { reloadOptions } from './options';
import ImportPathHelpers from './helpers/import-path-helpers';
import path from 'path';
import logger from './logger';

const expect = chai.expect;

describe('ScssProcessor', function() {
  describe('#isRoot', function() {
    it('should return false if the filename starts with an underscore', function z() {
      const file = generateFileObject('./_test.scss', '');

      const options = { ...reloadOptions(), enableSassCompilation: true };
      const processor = new ScssProcessor(options);

      expect(processor.isRoot(file)).to.be.false;
    });

    it('should return false if the file options "isImport" property is true', function z() {
      const file = generateFileObject('./test.scss', '');
      file.fileOptions.isImport = true;

      const options = { ...reloadOptions(), enableSassCompilation: true };
      const processor = new ScssProcessor(options);

      expect(processor.isRoot(file)).to.be.false;
    });

    it('should return true if the above conditions are not met', function z() {
      const file = generateFileObject('./test.scss', '');

      const options = { ...reloadOptions(), enableSassCompilation: true };
      const processor = new ScssProcessor(options);

      expect(processor.isRoot(file)).to.be.true;
    });
  });

  describe('#shouldProcess', function() {
    it('should return true if enableSassCompilation is true', function z() {
      const file = generateFileObject('./test.scss', '');

      const options = { ...reloadOptions(), enableSassCompilation: true };
      const processor = new ScssProcessor(options);

      expect(processor.shouldProcess(file)).to.be.true;
    });

    it('should return false if enableSassCompilation is false', function z() {
      const file = generateFileObject('./test.scss', '');

      const options = { ...reloadOptions(), enableSassCompilation: false };
      const processor = new ScssProcessor(options);

      expect(processor.shouldProcess(file)).to.be.false;
    });

    it('should return true if the enableSassCompilation array contains the file\'s extension', function z() {
      const file = generateFileObject('./test.scss', '');

      const options = { ...reloadOptions(), enableSassCompilation: ['scss'] };
      const processor = new ScssProcessor(options);

      expect(processor.shouldProcess(file)).to.be.true;
    });

    it('should return false if the enableSassCompilation array does not contain the file\'s extension', function z() {
      const file = generateFileObject('./test.scss', '');

      const options = { ...reloadOptions(), enableSassCompilation: [] };
      const processor = new ScssProcessor(options);

      expect(processor.shouldProcess(file)).to.be.false;
    });
  });

  describe('#process', function() {
    describe('file.contents', function() {
      it('should transpile the passed in file', async function z() {
        const file = generateFileObject('./test.scss', '.test { .nested { color: red; } } .test2 { color: blue; } // a comment');

        const options = { ...reloadOptions(), enableSassCompilation: true };
        const processor = new ScssProcessor(options);
        await processor.process(file);

        expect(file.contents).to.equal('.test .nested {\n  color: red; }\n\n.test2 {\n  color: blue; }\n\n/*# sourceMappingURL=.test.scss.map */');
      });
    });

    describe('file.referencedImportPaths', function() {
      it('should list all of the files that the current file imports', async function z() {
        const allFiles = new Map();
        addFile(generateFileObject('./direct-import1.scss', '.test { color: red; }'));
        addFile(generateFileObject('./direct-import2.scss', '@import "./indirect-import.scss"; .test { color: red; }'));
        addFile(generateFileObject('./indirect-import.scss', '.test { color: red; }'));
        const file = generateFileObject('./test.scss', '@import "./direct-import1.scss"; @import "./direct-import2"; .test { color: blue; }');

        const options = { ...reloadOptions(), enableSassCompilation: true, extensions: ['scss'] };
        const processor = new ScssProcessor(options);
        await processor.process(file, allFiles);

        expect(file.referencedImportPaths).to.eql([
          'D:/projects/meteor-css-modules/direct-import1.scss',
          'D:/projects/meteor-css-modules/direct-import2.scss',
          'D:/projects/meteor-css-modules/indirect-import.scss'
        ]);

        function addFile(file) {
          allFiles.set(file.importPath, file);
        }
      });
    });

    describe('file.sourcemap', function() {
      it('should generate a sourcemap', async function z() {
        const file = generateFileObject('./test.scss', '.test { color: red; } .test2 { color: blue; }');

        const options = { ...reloadOptions(), enableSassCompilation: true };
        const processor = new ScssProcessor(options);
        await processor.process(file);

        expect(file.sourceMap).to.eql({
          'version': 3,
          'sourceRoot': '.',
          'file': '.test.scss',
          'sources': [
            'test.scss'
          ],
          'sourcesContent': [
            '.test { color: red; } .test2 { color: blue; }'
          ],
          'mappings': 'AAAA,AAAA,KAAK,CAAC;EAAE,KAAK,EAAE,GAAI,GAAI;;AAAA,AAAA,MAAM,CAAC;EAAE,KAAK,EAAE,IAAK,GAAI',
          'names': []
        });
      });
    });

    it('should log a friendly error when node-sass encounters an error', function z(done) {
      const file = generateFileObject('./test.scss', '.test { error! }');

      let fullErrorMessage = '';
      logger.test(function() {
        logger.error.addHook(errorMessage => {
          fullErrorMessage += errorMessage;
        });

        const options = { ...reloadOptions(), enableSassCompilation: true };
        const processor = new ScssProcessor(options);
        try {
          processor.process(file);
        } catch (err) {
          expect(fullErrorMessage).to.equal('\n/~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Processing Step: SCSS compilationUnable to compile D:/projects/meteor-css-modules/test.scss\nLine: 1, Column: 9\nError: property "error" must be followed by a \':\'\n/~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
          done();
        }
      });
    });
    it('should throw an error when node-sass encounters an error', function z(done) {
      const file = generateFileObject('./test.scss', '.test { error! }');

      logger.test(function() {
        const options = { ...reloadOptions(), enableSassCompilation: true };
        const processor = new ScssProcessor(options);
        try {
          processor.process(file);
        } catch (err) {
          done();
        }
      });
    });

  });
});

function generateFileObject(filePath, rawContents, packageName = null) {
  const file = {
    fileOptions: {},
    rawContents,
    referencedImportPaths: [],
    getPackageName() {
      return packageName;
    },
    getPathInPackage() {
      return filePath;
    },
    getBasename() {
      return path.basename(filePath);
    },
    getExtension() {
      return path.extname(filePath);
    }
  };

  file.getFileOptions = function() {
    return file.fileOptions;
  };

  file.importPath = ImportPathHelpers.getImportPathInPackage(file);

  return file;
}
