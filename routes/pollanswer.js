var express = require('express');
var router = express.Router();

var global = require('../configuration/global.js');

var validator = require('validator');

var User = require('../models/user.js');
var Blob = require('../models/blob.js');
var Poll = require('../models/poll.js');
var PollQuestion = require('../models/pollquestion.js');
var PollAnswer = require('../models/pollanswer.js');


router.get('/poll/answer/:pollid', function(req, res) {
  
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

router.post('/poll/answer', function(req,res){
  console.log(req.body)
  throw new Error("test");
  res.redirect('/poll/answer');
});

module.exports = router;
