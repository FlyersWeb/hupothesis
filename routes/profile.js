var express = require('express');
var router = express.Router();

var validator = require('validator');

var async  = require('async');

var global = require('../configuration/global.js');

var User = require('../models/user.js');
var Blob = require('../models/blob.js');

var File = require('../models/file.js');
var FileAnswer = require('../models/fileanswer.js');

var Poll = require('../models/poll.js');
var PollQuestion = require('../models/pollquestion.js');
var PollAnswer = require('../models/pollanswer.js');

var Contestant = require('../models/contestant.js');


function calculateAnswerTime(viewed, answered)
{
  var ret = 0;
  if( answered && viewed )
    ret = answered.getTime()-viewed.getTime();
  if(ret<0) ret = 0;
  return ret;
}

function prepareDatas(user, files, fanswers, polls, pquestions, panswers, contestants)
{
  var ret = {};

  var user = user.toObject();

  var dfiles = [];
  for (var i=0; i<files.length; i++) {
    var file = files[i];
    file = file.toObject();
    file.answers = [];
    for(var j=0; j<fanswers.length; j++) {
      var fanswer = fanswers[j];
      fanswer = fanswer.toObject();
      fanswer.ansTime = calculateAnswerTime(fanswer.viewed, fanswer.added);
      for(var k=0; k<contestants.length; k++){
        var contestant = contestants[k];
        if(fanswer.contestant.toString() == contestant._id.toString()) {
          fanswer.contestant = contestant.toObject();
        }
      }
      if(fanswer.blob.toString() == file._id.toString()){
        file.answers.push(fanswer);
      }
    }
    dfiles.push(file);
  }

  var dpolls = [];
  for(var i=0; i<polls.length; i++) {
    var poll = polls[i];
    poll = poll.toObject();
    poll.questions = [];
    for(var j=0; j<pquestions.length; j++) {
      var pquestion = pquestions[j];
      pquestion = pquestion.toObject();
      pquestion.answers = [];
      for(var k=0; k<panswers.length; k++) {
        var panswer = panswers[k];
        panswer = panswer.toObject();
        panswer.ansTime = calculateAnswerTime(panswer.viewed, panswer.added);
        for(var l=0; l<contestants.length; l++){
          var contestant = contestants[l];
          if(panswer.contestant.toString() == contestant._id.toString()) {
            panswer.contestant = contestant.toObject();
          }
        }
        if(panswer.question.toString() == pquestion._id.toString()) {
          pquestion.answers.push(panswer);
        }
      }
      if(pquestion.blob.toString() == poll._id.toString()){
        poll.questions.push(pquestion);
      }
    }
    dpolls.push(poll);
  }

  ret.user = user;
  ret.user.files = dfiles;
  ret.user.polls = dpolls;

  return ret;
};

router.get('/profile/:userid', global.requireAuth, function(req, res, next){

  var userid = req.param('userid');
  userid = validator.toString(userid);

  if(userid.length <= 0) {
    res.redirect('/');
    return;
  }


  User.findOne({'_id':userid,'deleted':null}, function(err, user){
    if(err) {
      next(err);
      return;
    }

    if(!user) {
      res.redirect('/login');
      return;
    }

    async.parallel([
      function(cb){
        Blob.find({'user':user.id,'kind':'file','deleted':null},function(err, blobs){
          if(err) {
            next(err);
            return;
          }
          FileAnswer.find({'blob':{$in:blobs},'deleted':null},function(err,fanswers){
            if(err) {
              next(err);
              return;
            }
            var contestants = fanswers.map(function(e){return e.contestant});
            Contestant.find({'_id':{$in:contestants},'deleted':null},function(err,contestants){
              if(err){
                next(err);
                return;
              }
              cb(null,blobs,fanswers,contestants);
            });
          });
        });
      },
      function(cb){
        Blob.find({'user':user.id,'kind':'poll','deleted':null},function(err, blobs){
          if(err) {
            next(err);
            return;
          }
          PollQuestion.find({'blob':{$in:blobs},'deleted':null},function(err,pquestions){
            if(err) {
              next(err);
              return;
            }
            PollAnswer.find({'question':{$in:pquestions},'deleted':null},function(err,panswers){
              if(err) {
                next(err);
                return;
              }
              var contestants = panswers.map(function(e){return e.contestant});
              Contestant.find({'_id':{$in:contestants},'deleted':null},function(err,contestants){
                if(err){
                  next(err);
                  return;
                }
                cb(null,blobs,pquestions,panswers,contestants);
              });
            });
          });
        });
      }
      ],function(err,results){
        if(err){
          next(err);
          return;
        }

        var files = [];
        var fanswers = [];
        var polls = [];
        var pquestions = [];
        var panswers = [];
        var contestants = [];

        if(results[0][0].length>0) files=files.concat(results[0][0]);
        if(results[0][1].length>0) fanswers=fanswers.concat(results[0][1]);
        if(results[0][2].length>0) contestants=contestants.concat(results[0][2]);
        if(results[1][0].length>0) polls=polls.concat(results[1][0]);
        if(results[1][1].length>0) pquestions=pquestions.concat(results[1][1]);
        if(results[1][2].length>0) panswers=panswers.concat(results[1][2]);
        if(results[1][3].length>0) contestants=contestants.concat(results[1][3]);

        var data = prepareDatas(user, files, fanswers, polls, pquestions, panswers, contestants);

        /**
        * data format
        * data.user.files.answers.contestant
        * data.user.polls.questions.answers.contestant
        */
        res.render('profile', { 'data':data, 'app':global.app, 'notice': req.flash('profileNotice'), 'error': req.flash('profileError'), csrf: req.csrfToken() });
    });

/*
    Blob.find({'user':user.id,'deleted':null},function(err, blobs){
      if(err) {
        next(err);
        return;
      }

        FileAnswer.find({'blob':{$in:blobs},'deleted':null},function(err,fanswers){
          if(err) {
            next(err);
            return;
          }
          
            PollQuestion.find({'blob':{$in:blobs},'deleted':null},function(err,pquestions){
              if(err) {
                next(err);
                return;
              }


              PollAnswer.find({'blob':{$in:blobs},'deleted':null},function(err,panswers){
                if(err) {
                  next(err);
                  return;
                }

                var contestantids = [];
                for(var i=0; i<fanswers.length; i++){
                  var fanswer = fanswers[i];
                  contestantids.push(fanswer.contestant);
                }
                for(var i=0; i<panswers.length; i++){
                  var panswer = panswers[i];
                  contestantids.push(panswer.contestant);
                }

                Contestant.find({'_id':{$in:contestantids},'deleted':null},function(err,contestants){

                  var data = prepareDatas(user, files, fanswers, polls, pquestions, panswers, contestants);

                  /**
                  * data format
                  * data.user.files.answers.contestant
                  * data.user.polls.questions.answers.contestant
                  
                  res.render('profile', { 'data':data, 'app':global.app, 'notice': req.flash('profileNotice'), 'error': req.flash('profileError'), csrf: req.csrfToken() });

                });
              });
            });
        });
    });
*/
  });
});

module.exports = router;