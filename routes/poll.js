var express = require('express');
var router = express.Router();

var global = require('../configuration/global.js');

var validator = require('validator');

var _ = require('underscore');

var User = require('../models/user.js');
var Blob = require('../models/blob.js');
var Poll = require('../models/poll.js');
var PollQuestion = require('../models/pollquestion.js');
var PollQuestion = require('../models/pollquestion.js');


/* GET home page. */
router.get('/poll', global.requireAuth, function(req, res) {
  res.render('poll', { notice: req.flash('pollNotice'), error: req.flash('pollError'), captcha_key: global.captcha.public_key, csrf: req.csrfToken() });
});

router.post('/poll', global.requireAuth, function(req, res){

  // TODO add check question_title empty
  // TODO add poll answer link and share widget
  var question_titles = req.body.question_title;

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

    var blob = new Blob({'user':user.id});
    blob.save(function(err){
      if(err){
        next(err);
        return; 
      }

      var poll = new Poll({'blob':blob.id});
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

        req.flash('pollNotice', 'Your Poll was saved with success');
        res.redirect('/poll');
        return;

      });
    });
  });

});

module.exports = router;
