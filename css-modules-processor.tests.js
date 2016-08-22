/* eslint-env node, mocha */
import './test-helpers/global-variables.stub';
import chai from 'chai';
import CssModulesProcessor from './css-modules-processor';
import { reloadOptions } from './options';
import ImportPathHelpers from './helpers/import-path-helpers';

const expect = chai.expect;

describe('CssModulesProcessor', function() {
  describe('#process()', function() {
    it('should transpile the passed in file', async function z() {
      const file = {
        importPath: './test.css',
        contents: '.test { color: red; } .test2 { color: blue; }',
        getPathInPackage() {
          return './test.css';
        }
      };

      const processor = new CssModulesProcessor({...reloadOptions()});
      await processor.process(file);

      expect(file.contents).to.equal('._test__test { color: red; } ._test__test2 { color: blue; }\n/*# sourceMappingURL=test.css.map */');
    });

    it('should not transpile passthrough files', async function z() {
      const file = {
        importPath: './test.css',
        contents: '.test { color: red; } .test2 { color: blue; }',
        getPathInPackage() {
          return './test.css';
        }
      };
      const pluginOptions = {...reloadOptions()};
      pluginOptions.passthroughPaths.push(/test/);

      const processor = new CssModulesProcessor(pluginOptions);
      await processor.process(file);

      expect(file.contents).to.equal('.test { color: red; } .test2 { color: blue; }');
    });

    it('should export the class names as an object', async function z() {
      const file = {
        importPath: './test.css',
        contents: '.test { color: red; } .test-two { color: blue; }',
        getPathInPackage() {
          return './test.css';
        }
      };
      const pluginOptions = {...reloadOptions()};
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
        getPathInPackage() {
          return './test.css';
        }
      };
      const pluginOptions = {...reloadOptions()};
      pluginOptions.jsClassNamingConvention.camelCase = true;
      const processor = new CssModulesProcessor(pluginOptions);
      await processor.process(file);

      expect(file.tokens).to.eql({
        'test': '_test__test',
        'testTwo': '_test__test-two'
      });
    });

  });
});
