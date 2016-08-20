/* eslint-env node, mocha */
import './test-helpers/global-variables.stub';
import chai from 'chai';
import CssModulesProcessor from './css-modules-processor';

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
      const processor = new CssModulesProcessor();
      await processor.process(file);

      expect(file.contents).to.equal('._test__test { color: red; } ._test__test2 { color: blue; }\n/*# sourceMappingURL=test.css.map */');
    });

    it('should export the class names as JSON', function z() {
      throw new Error();
    });

    it('should camelcase the JSON class names when the camelcase option is enabled', function z() {
      throw new Error();
    });
  });
});
