/* eslint-env node, mocha */
import './test-helpers/global-variables.stub';
import chai from 'chai';
import CssModulesProcessor from './css-modules-processor';
import { reloadOptions } from './options';
import ImportPathHelpers from './helpers/import-path-helpers';

const expect = chai.expect;

describe('CssModulesProcessor', function() {
  describe('#process()', function() {
    describe('file.contents', function() {
      it('should transpile the passed in file', async function z() {
        const file = {
          importPath: './test.css',
          contents: '.test { color: red; } .test2 { color: blue; }',
          referencedImportPaths: [],
          getPathInPackage() {
            return './test.css';
          }
        };

        const processor = new CssModulesProcessor({ ...reloadOptions() });
        await processor.process(file);

        expect(file.contents).to.equal('._test__test { color: red; } ._test__test2 { color: blue; }\n/*# sourceMappingURL=test.css.map */');
      });

      it('should not transpile passthrough files', async function z() {
        const file = {
          importPath: './test.css',
          contents: '.test { color: red; } .test2 { color: blue; }',
          referencedImportPaths: [],
          getPathInPackage() {
            return './test.css';
          }
        };
        const pluginOptions = { ...reloadOptions() };
        pluginOptions.passthroughPaths.push(/test/);

        const processor = new CssModulesProcessor(pluginOptions);
        await processor.process(file);

        expect(file.contents).to.equal('.test { color: red; } .test2 { color: blue; }');
      });
    });

    describe('file.tokens', function() {
      it('should export the class names as an object', async function z() {
        const file = {
          importPath: './test.css',
          contents: '.test { color: red; } .test-two { color: blue; }',
          referencedImportPaths: [],
          getPathInPackage() {
            return './test.css';
          }
        };
        const pluginOptions = { ...reloadOptions() };
        const processor = new CssModulesProcessor(pluginOptions);
        await processor.process(file);

        expect(file.tokens).to.eql({
          'test': '_test__test',
          'test-two': '_test__test-two'
        });
      });

      it('should camelcase the JS class names when the camelcase option is enabled', async function z() {
        const file = {
          importPath: './test.css',
          contents: '.test { color: red; } .test-two { color: blue; }',
          referencedImportPaths: [],
          getPathInPackage() {
            return './test.css';
          }
        };
        const pluginOptions = { ...reloadOptions() };
        pluginOptions.jsClassNamingConvention.camelCase = true;
        const processor = new CssModulesProcessor(pluginOptions);
        await processor.process(file);

        expect(file.tokens).to.eql({
          'test': '_test__test',
          'testTwo': '_test__test-two'
        });
      });

      it('should pull in tokens from imported files', async function z() {
        const allFiles = new Map();
        addFile(generateFileObject('./direct-import1.css', '.test { color: red; }'));
        addFile(generateFileObject('./direct-import2.css', '.test { composes: test from "./indirect-import.css"; }'));
        addFile(generateFileObject('./indirect-import.css', '.test { color: red; }'));
        const file = generateFileObject('./test.css', '.test { composes: test from "./direct-import1.css"; } .test-two { composes: test from "./direct-import2.css"; }');
        const pluginOptions = { ...reloadOptions() };
        const processor = new CssModulesProcessor(pluginOptions);
        await processor.process(file, allFiles);

        expect(file.tokens).to.eql({
          'test': '_test__test _direct_import1__test',
          'test-two': '_test__test-two _direct_import2__test _indirect_import__test'
        });

        function addFile(file) {
          allFiles.set(file.importPath, file);
        }
      });
    });

    describe('file.referencedImportPaths', function() {
      it('should list all of the files that the current file imports', async function z() {
        const allFiles = new Map();
        addFile(generateFileObject('./direct-import1.css', '.test { color: red; }'));
        addFile(generateFileObject('./direct-import2.css', '.test { composes: test from "./indirect-import.css"; }'));
        addFile(generateFileObject('./indirect-import.css', '.test { color: red; }'));
        const file = generateFileObject('./test.css', '.test { composes: test from "./direct-import1.css"; } .test-two { composes: test from "./direct-import2.css"; }');
        const pluginOptions = { ...reloadOptions() };
        const processor = new CssModulesProcessor(pluginOptions);
        await processor.process(file, allFiles);

        expect(file.referencedImportPaths).to.eql([
          'D:/projects/meteor-css-modules/direct-import1.css',
          'D:/projects/meteor-css-modules/direct-import2.css',
          'D:/projects/meteor-css-modules/indirect-import.css'
        ]);

        function addFile(file) {
          allFiles.set(file.importPath, file);
        }
      });

      it('should build a deduplicated list of all the files that the current file imports directly or indirectly', async function z() {
        const allFiles = new Map();
        addFile(generateFileObject('./direct-import1.css', '.test { color: red; }'));
        addFile(generateFileObject('./direct-import2.css', '.test { composes: test from "./indirect-import.css"; }'));
        addFile(generateFileObject('./indirect-import.css', '.test { composes: test from "./direct-import1.css"; }'));
        const file = generateFileObject('./test.css', '.test { composes: test from "./direct-import1.css"; } .test-two { composes: test from "./direct-import2.css"; }');
        const pluginOptions = { ...reloadOptions() };
        const processor = new CssModulesProcessor(pluginOptions);
        await processor.process(file, allFiles);

        expect(file.referencedImportPaths).to.eql([
          'D:/projects/meteor-css-modules/direct-import1.css',
          'D:/projects/meteor-css-modules/direct-import2.css',
          'D:/projects/meteor-css-modules/indirect-import.css'
        ]);

        function addFile(file) {
          allFiles.set(file.importPath, file);
        }
      });
    });

    // TODO fix the Babel file.imports to the importedFile.relativePath property

  });
});

function generateFileObject(path, contents, packageName = null) {
  const file = {
    contents,
    referencedImportPaths: [],
    getPackageName() {
      return packageName;
    },
    getPathInPackage() {
      return path;
    }
  };
  file.importPath = ImportPathHelpers.getImportPathInPackage(file);

  return file;
}
