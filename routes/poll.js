var express = require('express');
var router = express.Router();

var global = require('../configuration/global.js');

var validator = require('validator');

var _ = require('underscore');

var User = require('../models/user.js');
var Blob = require('../models/blob.js');
var PollQuestion = require('../models/pollquestion.js');


router.get('/poll', global.requireAuth, function(req, res, next) {

  User.findOne({'_id':req.session.passport.user,'deleted':null}, function(err, user){
    if(err) {
      next(err);
      return;
    }

    res.render('poll', { options: req.flash('pollOptions')[0], user: user.toObject(), notice: req.flash('pollNotice'), error: req.flash('pollError'), captcha_key: global.captcha.public_key, csrf: req.csrfToken() });
  });
});

router.post('/poll', global.requireAuth, function(req, res, next){

  // TODO add check question_title empty
  var question_titles = req.body.question_title;

  var title = req.body.title;
  title = validator.toString(title);

  var instruction = req.body.instruction;
  instruction = validator.toString(instruction);

  var tag = validator.toString(req.body.tags);
  var tags = tag.split(',');
  tags = _.map(tags,function(el){return el.trim();});

  User.findOne({'_id':req.session.passport.user,'deleted':null},function(err,user){
    if(err){
      next(err);
      return;
    }

    if(!user){
      req.flash('pollError', 'Oops ! Unknown user !');
      res.redirect('/poll');
      return;
    }

    var blob = new Blob({'kind':'poll','user':user.id,'title':title,'instruction':instruction,'tags':tags});
    blob.save(function(err){
      if(err){
        next(err);
        return; 
      }

      for(var i=0;i<question_titles.length;i++){
        var question_title = question_titles[i];
        
        var question_type = req.body['question_type_'+i];
        
        var question_answers = req.body['question_answer_'+i];
        question_answers = _.filter(question_answers,function(e){
          if(e.trim().length>0) return e;
        });
        
        var question_points = req.body['question_point_'+i];
        question_points = _.filter(question_points,function(e){
          if(e.trim().length>0) return e;
        });

        var pollquestion = new PollQuestion({'blob':blob.id,'prompt':question_title,'type':question_type,'choices':question_answers, 'points':question_points});
        pollquestion.save(function(err){
          if(err){
            next(err);
            return;
          }
        });
      }

      var options = { blobid: blob.id, userid: user.id, url:global.app.url };        

      req.flash('pollNotice', 'Your Poll was successfully created.');
      req.flash('pollOptions', options);        
      res.redirect('/poll');
      return;

    });
  });

});

router.get('/poll/delete/:blobid', global.requireAuth, function(req, res, next){
  var userid = req.session.passport.user;

  var blobid = req.param('blobid');
  blobid = validator.toString(blobid);

  Blob.update({'_id':blobid,'kind':'poll'},{$set:{'deleted':new Date()}},function(err,blob){
    if(err){
      next(err);
      return;
    }

    req.flash('profileNotice','Poll deleted successfully');
    res.redirect('/profile/'+userid);
    return;

  });

});

module.exports = router;
