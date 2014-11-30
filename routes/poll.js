var express = require('express');
var router = express.Router();

var global = require('../configuration/global.js');

var validator = require('validator');

var _ = require('underscore');

var User = require('../models/user.js');
var Blob = require('../models/blob.js');
var Poll = require('../models/poll.js');
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

  var polltitle = req.body.title;
  polltitle = validator.toString(polltitle);

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

    var blob = new Blob({'user':user.id,'tags':tags});
    blob.save(function(err){
      if(err){
        next(err);
        return; 
      }

      var poll = new Poll({'blob':blob.id,'title':polltitle});
      poll.save(function(err){
        if(err){
          next(err);
          return;
        }

        for(var i=0;i<question_titles.length;i++){
          var question_title = question_titles[i];
          var question_type = req.body['question_type_'+i];
          var question_answers = req.body['question_answer_'+i];

          var pollquestion = new PollQuestion({'poll':poll.id,'prompt':question_title,'type':question_type,'choices':question_answers});
          pollquestion.save(function(err){
            if(err){
              next(err);
              return;
            }
          });
        }

        var options = { pollid: poll.id, userid: user.id, url:global.app.url };        

        req.flash('pollNotice', 'Your Poll was successfully created.');
        req.flash('pollOptions', options);        
        res.redirect('/poll');
        return;

      });
    });
  });

});

router.get('/poll/delete/:pollid', global.requireAuth, function(req, res, next){
  var userid = req.session.passport.user;

  var pollid = req.param('pollid');
  pollid = validator.toString(pollid);

  Poll.findById(pollid,function(err,poll){
    if(err){
      next(err);
      return;
    }

    Poll.update({'_id':poll.id},{'deleted':new Date()},{},function(err,poll){
      if(err){
        next(err);
        return;
      }

      req.flash('profileNotice','Poll deleted successfully');
      res.redirect('/profile/'+userid);
      return;
    });
  });

});

module.exports = router;
