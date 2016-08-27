/* eslint-env node */
/* global Promise */
import Future from 'fibers/future';

// noinspection JSUndefinedPropertyAssignment
global.Npm = {
  require
};

/* eslint-disable no-extend-native */
Promise.prototype.await = function await() {
  const future = new Future();
  this.then(function(result) {
    future.return(result);
  }).catch(function (err){
    future.throw(err);
  });
  return future.wait();
};
