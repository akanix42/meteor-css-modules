let suppressAllOutput = false;
const logFunctions = [
  'log',
  'error',
  'warn',
  'info'
];
const logger = {
  async test(cb) {
    suppressAllOutput = true;
    const result = await cb();
    suppressAllOutput = false;

    logFunctions.forEach(logFunction => logger[logFunction].removeAllHooks());

    if (result) return result;
  },
};

logger.logException = function logException(err) {
  logger.error(stringifyError(err, null, 2));

  /* Bryan Larsen, http://stackoverflow.com/a/20405830/1090626 */
  function stringifyError(err, filter, space) {
    var plainObject = {};
    Object.getOwnPropertyNames(err).forEach(function(key) {
      plainObject[key] = err[key];
    });
    return JSON.stringify(plainObject, filter, space);
  };
};

export default logger;

logFunctions.forEach(logFunction => logger[logFunction] = generateOutputFunction(logFunction));

function generateOutputFunction(logFunction) {
  const hooks = [];
  const fn = function callLogFunction(...args) {
    const suppressMessage = hooks.some(hookFn => hookFn(...args) === false);
    if (suppressAllOutput || suppressMessage) return;
    console[logFunction](...args);
  };
  fn.addHook = hookFn => hooks.push(hookFn);
  fn.removeHook = hookFn => hooks.splice(hooks.indexOf(hookFn), 1);
  fn.removeAllHooks = () => hooks.length = 0;

  return fn;
}
