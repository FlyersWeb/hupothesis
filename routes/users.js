var EventEmitter = require('events').EventEmitter,
    ee = new EventEmitter();

var express = require('express');
var router = express.Router();

var validator = require('validator');

var moment = require('moment');

var async = require('async');

var User = require('../models/user.js');
var Contestant = require('../models/contestant.js');
var File = require('../models/file.js');
var Answer = require('../models/fileanswer.js');

var global = require('../configuration/global.js');

var tToDHM = function(t) {
  var cd = 24 * 60 * 60 * 1000,
      ch = 60 * 60 * 1000,
      d = Math.floor(t / cd),
      h = '0' + Math.floor( (t - d * cd) / ch),
      m = '0' + Math.round( (t - d * cd - h * ch) / 60000);
  return [d, h.substr(-2), m.substr(-2)];
};

var DHMToT = function(dhm) {
  var cd = 24 * 60 * 60 * 1000,
      ch = 60 * 60 * 1000,
      cm = 60 * 1000;
  var d = dhm[0];
  var h = dhm[1];
  var m = dhm[2];
  return d * cd + h * ch + m * cm;
};

/* GET users listing. */
router.get('/', function(req, res) {
  res.send('respond with a resource');
});


router.get('/unsubscribe/:userid', function(req, res, next){

  var userid = req.param('userid');
  userid = validator.toString(userid);

  Contestant.findOne({'_id':userid, 'deleted':null}, function(err, contestant){

    if(err) {
      next(err);
    }

    if ( !contestant ) {
      res.render('unsubscribe', {title:'Unsubscription', notice:'User not present in our newsletters'});
    }

    Contestant.update({'_id':contestant.id}, {'optin':false}, {}, function(err){
      if(err)
        next(err);

        res.render('unsubscribe', {title:'Unsubscription completed', notice:'User removed from our newsletter with success'});
    });

  });

});


module.exports = router;
