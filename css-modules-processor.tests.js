/* eslint-env node, mocha */
import './test-helpers/global-variables.stub';
import chai from 'chai';
import CssModulesProcessor from './css-modules-processor';
import pluginOptionsWrapper, { reloadOptions } from './options';

const expect = chai.expect;

let pluginOptions = pluginOptionsWrapper.options;
describe('CssModulesProcessor', function() {
  before(function() {
    pluginOptions = reloadOptions();
  });
  after(function() {
    pluginOptions = reloadOptions();
  });

  describe('#process()', function() {
    it('should transpile the passed in file', async function z() {
      const file = {
        importPath: './test.css',
        contents: '.test { color: red; } .test2 { color: blue; }',
        getPathInPackage() {
          return './test.css';
        }
      };
      const processor = new CssModulesProcessor(pluginOptions);
      await processor.process(file);

      expect(file.contents).to.equal('._test__test { color: red; } ._test__test2 { color: blue; }\n/*# sourceMappingURL=test.css.map */');
    });

    it('should export the class names as an object', async function z() {
      const file = {
        importPath: './test.css',
        contents: '.test { color: red; } .test-two { color: blue; }',
        getPathInPackage() {
          return './test.css';
        }
      };
      const processor = new CssModulesProcessor(pluginOptions);
      await processor.process(file);

      expect(file.tokens).to.eql({
        'test': '_test__test',
        'test-two': '_test__test-two'
      });
    });

    it('should camelcase the JSON class names when the camelcase option is enabled', async function z() {
      const file = {
        importPath: './test.css',
        contents: '.test { color: red; } .test-two { color: blue; }',
        getPathInPackage() {
          return './test.css';
        }
      };
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
