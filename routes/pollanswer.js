var express = require('express');
var router = express.Router();

var global = require('../configuration/global.js');

var validator = require('validator');

var simple_recaptcha = require('simple-recaptcha');

var User = require('../models/user.js');
var Contestant = require('../models/contestant.js');
var Blob = require('../models/blob.js');
var Poll = require('../models/poll.js');
var PollQuestion = require('../models/pollquestion.js');
var PollAnswer = require('../models/pollanswer.js');


router.get('/poll/answer/:pollid', function(req, res, next) {
  
  var pollid = req.param('pollid');
  pollid = validator.toString(pollid);

  Poll.findOne({'_id':pollid,'deleted':null},function(err,poll){
    if(err){
      next(err);
      return;
    }

    if(!poll){
      req.flash('pollAnswerError', 'Oops ! Unknown poll');
      res.render('pollanswer', { notice: req.flash('pollAnswerNotice'), error: req.flash('pollAnswerError'), captcha_key: global.captcha.public_key, csrf: req.csrfToken() });
      return;
    }

    var pollObj = poll.toObject();
    pollObj.questions = [];

    PollQuestion.find({'poll':poll.id,'deleted':null}, function(err,pollquestions){
      if(err){
        next(err);
        return;
      }

      for(var i=0;i<pollquestions.length;i++){
        var pollquestion = pollquestions[i];
        var pollquestionObj = pollquestion.toObject();
        pollquestionObj.id = i;
        pollObj.questions.push(pollquestionObj);
      }

      res.render('pollanswer', { poll: pollObj, notice: req.flash('pollAnswerNotice'), error: req.flash('pollAnswerError'), captcha_key: global.captcha.public_key, csrf: req.csrfToken() });
    });

  });
});

router.post('/poll/answer', function(req, res, next){
  console.log(req.body)

  var qids = req.body.question_ids;

  var pollid = req.body.pollid;
  pollid=validator.toString(pollid);

  if ( !validator.isEmail(req.body.email) ) {
    req.flash('pollAnswerError', 'Oops, invalid email !');
    res.redirect('/poll/answer/'+pollid);
    return;
  }

  var email = req.body.email;
  
  var ip = req.ip;
  var challenge = req.body.recaptcha_challenge_field;
  var response = req.body.recaptcha_response_field;
  var private_key = global.captcha.private_key;

  simple_recaptcha(private_key, ip, challenge, response, function(err) {
    if(err){
      next(err);
      return;
    }

    // Create contestant
    Contestant.findOne({'email':email,'deleted':null},function(err,contestant){
      if(err){
        next(err);
        return;
      }

      if(!contestant){
        var contestant = new Contestant({'email':email});
        contestant.save(function(err){
          if(err){
            next(err);
            return;
          }
        });
      }
      User.findOne({'local.email':email,'deleted':null},function(err,user){
        if(err) {
          next(err);
          return;
        }

        if (user) {
          Contestant.update({'_id':contestant.id,'deleted':null}, {'user':user.id}, {}, function(err){
            if(err){
              next(err);
              return;
            }
          });
        }
      });

      Poll.findOne({'_id':pollid,'deleted':null},function(err,poll){
        if(err){
          next(err);
          return;
        }
        if(!poll){
          res.redirect('/');
          return;
        }

        // Create answers
        PollQuestion.find({'_id':{$in: qids},'deleted':null},function(err,questions){
          if(err){
            next(err);
            return;
          }

          var answers = [];
          for(var i=0;i<questions.length;i++){
            var question=questions[i];
            var avalue=req.body['question_answer_'+i];
            var answer={'question':question.id,'contestant':contestant.id,'value':avalue};
            answers.push(answer);
          }

          PollAnswer.create(answers,function(err){
            if(err){
              next(err);
              return;
            }

            if(!req.session.contestant)
            req.session.contestant = contestant;

          /**************
            SHOULD SEND EMAIL
          ***************/

            req.flash('pollAnswerNotice','Thank you for your time, your answers were received');
            res.redirect('/poll/answer/'+poll.id);
            return;
          });
        });
      });
    });
  });


});

module.exports = router;
