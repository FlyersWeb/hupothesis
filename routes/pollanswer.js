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

  var callback = function(contestant) {
    
    if(!contestant){
      req.flash('pollAnswerError', "Oops! Invalid temporary user creation");
      res.render('pollanswer', { notice: req.flash('pollAnswerNotice'), error: req.flash('pollAnswerError'), captcha_key: global.captcha.public_key, csrf: req.csrfToken() });
      return;
    }
  
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
          PollAnswer.update({'question':pollquestion._id,'contestant':contestant._id},
                            {$set:{'poll':pollquestion.poll,'question':pollquestion._id,'contestant':contestant._id},$setOnInsert:{'viewed':new Date()}},
                            {upsert:true,multi:true},
            function(err){
              if(err){
                next(err);
                return;
              }
          });

          var pollquestionObj = pollquestion.toObject();
          pollquestionObj.id = i;
          pollObj.questions.push(pollquestionObj);
        }

        res.render('pollanswer', { 'contestant': contestant, 'poll': pollObj, notice: req.flash('pollAnswerNotice'), error: req.flash('pollAnswerError'), captcha_key: global.captcha.public_key, csrf: req.csrfToken() });

      });
    });
  };

  if (!req.session.contestant)
  {
    var contestant = new Contestant({});
    contestant.save(function(err){
      if(err) {
        next(err);
        return;
      }
      req.session.contestant = contestant;
      callback(contestant);
    });
  }
  else
  {
    var contestant = req.session.contestant;
    callback(contestant);
  }

});

router.post('/poll/answer', function(req, res, next){
  var qids = req.body.question_ids;

  var pollid = req.body.pollid;
  pollid=validator.toString(pollid);

  var email = req.body.email;

  if ( !validator.isEmail(email) ) {
    req.flash('pollAnswerError', 'Oops, invalid email !');
    res.redirect('/poll/answer/'+pollid);
    return;
  }

  var contestant = req.session.contestant;
  if(!contestant){
    req.flash('pollAnswerError', "Oops! you need to view our questionnaire before answering");
    res.redirect('/poll/answer/'+pollid);
    return;
  }
  
  var ip = req.ip;
  var challenge = req.body.recaptcha_challenge_field;
  var response = req.body.recaptcha_response_field;
  var private_key = global.captcha.private_key;

  simple_recaptcha(private_key, ip, challenge, response, function(err) {
    if(err){
      next(err);
      return;
    }

    Contestant.findOne({'email':email,'deleted':null},function(err,rcontest){
      if(err){
        next(err);
        return;
      }

      if(!rcontest) {
        Contestant.update({'_id':contestant._id,'deleted':null},{$set:{'email':email}},function(err){
          if(err){
            next(err);
            return;
          }
        });
      } else {
        contestant = rcontest;
        req.session.contestant = contestant;
      }

      User.findOne({'local.email':email,'deleted':null},function(err,user){
        if(err) {
          next(err);
          return;
        }

        if (user) {
          Contestant.update({'_id':contestant._id,'deleted':null}, {$set:{'user':user.id}}, function(err){
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
        PollQuestion.find({'poll':poll.id,'deleted':null},function(err,questions){
          if(err){
            next(err);
            return;
          }

          for(var i=0;i<questions.length;i++){
            var question=questions[i];
            var avalue=req.body['question_answer_'+i];

            PollAnswer.update({'question':question._id,'contestant':contestant._id},{$set:{'added':new Date()},$push:{'value':avalue}},{multi:true,upsert:true},function(err){
              if(err) {
                next(err);
                return;
              }
            });
          }

          req.session.contestant = contestant;

          /*  --- Email Notification ---  */
          var mailOptions = {
            from: global.email.user,
            to: ''+contestant.email+', '+global.email.user+'',
            subject: "[Hupothesis] Answers uploaded with success",
            text: "Congratulations, we've successfully received your answers for the poll : "+poll.title+". Your administrator will be notified."
          };

          global.email.transporter.sendMail(mailOptions, function(err, info){
              if(err){
                next(err);
                return;
              }else{
                console.log('Message sent: ' + info.response);
              }
          });
          /****************************************/

          req.flash('pollAnswerNotice','Your opinion was successfully received.');
          res.redirect('/poll/answer/'+poll.id);
          return;

        });
      });
    });
  });


});

module.exports = router;
