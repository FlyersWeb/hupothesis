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

  var ignoreMethod = getIgnoredMethods(ignoreMethods)

  return function hupothesis(req, res, next) {

    if (!ignoreMethod[req.method]) {
      req.hupothesisEvaluation = function() {
        var score = 0;
        var total = 0;
        var answers = req.body.answer;
        var ganswers = req.body.ganswer;
        var vanswers = req.body.vanswer;
        for(var qid in answers) {
          var answer = answers[qid];
          var ganswer = ganswers[qid];
          var vanswer = Number(vanswers[qid]);
          if(!isNaN(vanswer)) {
            var iganswers = intersect(answer, ganswer);
            total += vanswer;
            if(iganswers.length>0) score += vanswer;
          }
        }
        if( (typeof(req.body.timeMedian) !== "undefined") && (typeof(req.body.timeElapsed) !== "undefined") ) {
          var timestampMedian = req.body.timeMedian; var timeAnswer = req.body.timeElapsed;
          var timestampScore = ((timeAnswer-timestampMedian)/timestampMedian)*-1;
          score += timestampScore;
        }
        return (total<=0) ? 0 : ((score/total)*100).toFixed(2);
      };
    }
    next();
  }
};


/**
 * Intersection of two arrays.
 *
 * @param {array} arr1
 * @param {array} arr2
 * @returns {array}
 * @api private
 */

function intersect(arr1, arr2) {
  arr1 = (!Array.isArray(arr1)) ? [arr1] : arr1 ;
  arr2 = (!Array.isArray(arr2)) ? [arr2] : arr2 ;
  return arr1.filter(function(n){
    return arr2.indexOf(n) != -1;
  });
}

/**
 * Get a lookup of ignored methods.
 *
 * @param {array} methods
 * @returns {object}
 * @api private
 */

function getIgnoredMethods(methods) {
  var obj = Object.create(null)

  for (var i = 0; i < methods.length; i++) {
    var method = methods[i].toUpperCase()
    obj[method] = true
  }

  return obj
}
