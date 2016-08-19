let suppressAllOutput = false;
const logger = {
  async test(cb) {
    suppressAllOutput = true;
    const result = await cb();
    suppressAllOutput = false;
    if (result) return result;
  }
};
export default logger;

const logFunctions = [
  'log',
  'error',
  'warn',
  'info'
];
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

  return fn;
}
