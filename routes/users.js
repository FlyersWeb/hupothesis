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

router.get('/profile/:userid', function(req, res, next){

  var userid = req.param('userid');
  userid = validator.toString(userid);

  var profileInfo = {};

  async.waterfall([
    function(callback) {
      User.findOne({'_id':userid, 'deleted':null}, function(err, user){
        callback(null, user);
      });
    },
    function(user,callback) {
      FileInfo.find({'userid':user._id,'deleted':null}, function(err, fileInfos) {
        callback(null, user, fileInfos);
      });
    },
    function(user,fileInfos,callback){
      var ids = [];

      fileInfos.forEach(function(fileInfo) {
        ids.push(fileInfo._id);
      });

      AnswerInfo.find({'fileid':{$in:ids},'deleted':null}, function(err, answerInfos) {
          callback(null, user, fileInfos, answerInfos);
      });
    },
    function(user,fileInfos,answerInfos,callback) {
      var ids = [];

      answerInfos.forEach(function(answerInfo) {
        ids.push(answerInfo.userid);
      });

      User.find({'_id':{$in:ids},'deleted':null}, function(err, answerUsers) {
        callback(null, user, fileInfos, answerInfos, answerUsers);
      });
    }
  ], function(err, user, fileInfos, answerInfos, answerUsers) {

    if (err)
      next(err);
    
    var infos = [];

    for( var i=0; i<fileInfos.length; i++ ) {
      var fileInfo = fileInfos[i].toObject();

      var expectedAnsTime = null,
          dhm = null;
      var regex = global.app.regex;
      var regAns = regex.exec(fileInfo.anstime);

      if ( regAns ) {
        dhm = [regAns[1], regAns[2], regAns[3]];
        expectedAnsTime = DHMToT(dhm);
      }

      fileInfo.expectedAnsTime = dhm;

      fileInfo['answers'] = [];

      for ( var j=0; j<answerInfos.length; j++ ) {
        var answerInfo = answerInfos[j].toObject();

        var downloaded = moment(answerInfo.downloaded);
        var uploaded = moment(answerInfo.added);
        var ansTime = uploaded.diff(downloaded);

        var ansDHM = tToDHM(ansTime);

        answerInfo.ansTime = ansDHM;
        answerInfo.toLate = (ansTime > expectedAnsTime);

        answerInfo['user'] = {};

        for( var k=0; k<answerUsers.length; k++ ) {
          var answerUser = answerUsers[k].toObject();

          if ( answerUser._id.toString() == answerInfo.userid.toString() ) {
            answerInfo['user'] = answerUser;
          }

        }

        if ( answerInfo.fileid.toString() == fileInfo._id.toString() ) {
          fileInfo['answers'].push(answerInfo);
        }
      }

      infos.push(fileInfo);

    }

    res.render('profile', {title:"User profile", infos: infos});

  });

});

module.exports = router;
