var express = require('express');
var router = express.Router();

var validator = require('validator');

var moment = require('moment');

var async = require('async');

var User = require('../models/user.js');
var FileInfo = require('../models/fileinfo.js');
var AnswerInfo = require('../models/answerinfo.js');

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

router.get('/profile/:userid', function(req,res){

  var userid = req.param('userid');
  userid = validator.toString(userid);

  var profileInfo = {};

  async.waterfall([
    function(callback) {
      User.findOne({'_id':userid, 'deleted':null}, 'id email', function(err, user){
        callback(null, user);
      });
    },
    function(user,callback) {
      FileInfo.find({'userid':user._id,'deleted':null}, 'id filename uptime anstime added', function(err, fileInfos) {
        callback(null, user, fileInfos);
      });
    },
    function(user,fileInfos,callback){
      var ids = [];

      fileInfos.forEach(function(fileInfo) {
        ids.push(fileInfo._id);
      });

      AnswerInfo.find({'fileid':{$in:ids},'deleted':null}, 'id userid fileid filename downloaded added comments', function(err, answerInfos) {
          callback(null, user, fileInfos, answerInfos);
      });
    },
    function(user,fileInfos,answerInfos,callback) {
      var ids = [];

      answerInfos.forEach(function(answerInfo) {
        ids.push(answerInfo.userid);
      });

      User.find({'_id':{$in:ids},'deleted':null}, 'id email', function(err, answerUsers) {
        callback(null, user, fileInfos, answerInfos, answerUsers);
      });
    }
  ], function(err, user, fileInfos, answerInfos, answerUsers) {
    
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