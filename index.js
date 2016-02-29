/*!
 * hupothesis
 * MIT Licensed
 */

'use strict';

module.exports = function hupothesis(options) {
  options = options || {};

  var ignoreMethods = options.ignoreMethods === undefined 
    ? ['GET', 'HEAD', 'OPTIONS']
    : options.ignoreMethods;

  if(!Array.isArray(ignoreMethods)) {
    throw new TypeError('option ignoreMethods must be an Array');
  } 

  return function hupothesis(req, res, next) {
    next();
  }
};
