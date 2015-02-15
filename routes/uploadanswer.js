var express = require('express');
var router = express.Router();

var formidable = require('formidable');
var path = require('path');
var fs = require('fs-extra');

var validator = require('validator');

var simple_recaptcha = require('simple-recaptcha');

var global = require('../configuration/global.js');

var User = require('../models/user.js');
var Blob = require('../models/blob.js');
var FileAnswer = require('../models/fileanswer.js');
var Contestant = require('../models/contestant.js');


validator.extend('isExtSupported', function(str){
  if (global.app.fileExts.indexOf(str)>-1) return true;
  return false;
});

router.get('/upload/answer/:fileinfoid', function(req, res, err) {

  var fileinfoid = req.param('fileinfoid');

  var cb = function (blob) {
    FileAnswer.findOne({'contestant':req.session.contestant._id,'blob':blob.id,'filename':{$exists:true}},function(err,answer){
      if(err) {
        next(err);
        return;
      }
      if(!answer) {
        var answer = new FileAnswer({
          'contestant':req.session.contestant._id,
          'blob':blob.id,
          'viewed': Date.now()
        });
        answer.save(function(err,answer){
          if(err) {
            next(err);
            return;
          }
        });    
      } else {
        req.flash('answerNotice', "You've already answered the exam.");
      }
      res.render('answer', { fileinfo: blob.toObject(), contestant: req.session.contestant, error: req.flash('answerError'), notice: req.flash('answerNotice'), captcha_key: global.captcha.public_key, csrf: req.csrfToken() });
    });
  }

  Blob.findOne({'_id': fileinfoid, 'deleted':null}, function(err, blob){
    if (err) {
      next(err);
      return;
    }

    if ( !blob ) {
      res.redirect('/');
      return;
    }

    if ( !req.session.contestant) {
      var contestant = new Contestant();
      contestant.save(function(err,contestant){
        if(err) {
          next(err);
          return;
        }
        req.session.contestant = contestant;
        cb(blob);
      });
    } else {
      cb(blob);
    }
    
  });
});

// Upload answers
router.post('/upload/answer', function(req, res, next) {

  var form = new formidable.IncomingForm();
  form.uploadDir = "./tmp/";
  form.keepExtensions = false;

  form.on('progress', function(bReceived, bExpected) {
    if (bReceived > global.app.fileLimit) {
      req.pause();
      res.status = 400;
      res.end('upload limit exceeded');
    }
  });

  form.parse(req, function(err,fields,files){

    var email     = fields.email;
    var fileid    = fields.fileid;

    var ip        = req.ip;
    var challenge = fields.recaptcha_challenge_field;
    var response  = fields.recaptcha_response_field;
    var private_key = global.captcha.private_key;

    fileid = validator.toString(fileid);

    if ( !validator.isEmail(email) ) {
      req.flash('answerError', 'Oops, invalid email');
      res.redirect('/upload/answer/'+fileid);
      return;
    }

    var extension = path.extname(files.answerinfo.name);
    if( !validator.isExtSupported(extension) ) {
      req.flash('answerError', 'Oops, invalid file type, we only support '+global.app.fileExts.join(', '));
      res.redirect('/upload/answer/'+fileid);
      return;
    }

    if(!req.session.contestant){
      req.flash('answerError', "Oops! you need to view the exam before answering");
      res.redirect('/upload/answer/'+fileid);
      return;
    }

    simple_recaptcha(private_key, ip, challenge, response, function(err) {  

      if (err) {
        next(err);
        return;
      }

      Contestant.findById(req.session.contestant._id,function(err,contestant){
        if(err){
          next(err);
          return;
        }

        if(!contestant){
          req.flash('answerError', "Oops! you need to view the exam before answering");
          res.redirect('/upload/answer/'+fileid);
          return;
        } 

        User.findOne({'local.email':email,'deleted':null},function(err,user){
          if(err) {
            next(err);
            return;
          }

          if (user) {
            Contestant.update({'_id':contestant._id,'deleted':null}, {$set:{'user':user._id}}, function(err){
              if(err){
                next(err);
                return;
              }
            });
          }
          Contestant.update({'_id':contestant._id,'deleted':null}, {$set:{'email':email}}, function(err){
            if(err){
              next(err);
              return;
            }
          });
        });

        Blob.findOne({'_id':fileid,'deleted':null}, function(err,blob){
          if(err) {
            next(err);
            return;
          }

          if ( !blob ) {
            res.redirect('/');
            return;
          }

          FileAnswer.findOne({'blob':blob.id,'contestant':req.session.contestant._id,'deleted':null}, function(err, answer){
            if(err) {
              next(err);
              return;
            }

            if(!answer) {
              answer = new FileAnswer({'blob':blob.id,'contestant':req.session.contestant._id,'viewed':Date.now(),'filename':files.answerinfo.name,'comments':fields.comments,'added':Date.now()});
              answer.save(function(err){
                if(err) {
                  next(err);
                  return;
                }
              });
            }
            else {
              FileAnswer.update({'blob':blob.id,'contestant':req.session.contestant._id}, {'filename':files.answerinfo.name,'comments':fields.comments,'added':Date.now()}, function(err){
                if(err) {
                  next(err);
                  return;
                }
              });
            }

            fs.rename(files.answerinfo.path, form.uploadDir+answer.id, function(err){
              if (err) {
                next(err);
                return;
              }

              /*  --- Email Notification ---  */
              var mailOptions = {
                from: global.email.user,
                to: ''+contestant.email+', '+global.email.user+'',
                subject: "[Hupothesis] Answers uploaded with success",
                text: "Congratulations, you've successfully uploaded "+files.answerinfo.name+". Your administrator will be notified."
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

              User.findOne({'_id':blob.user,'deleted':null}, function(err,fileUser){
                if ( err ) {
                  next(err);
                  return;
                }

                if ( fileUser )
                {
                  /**********************************/
                  var mailOptions = {
                    from: global.email.user,
                    to: ''+fileUser.email+', '+global.email.user+'',
                    subject: "[Hupothesis] Answers uploaded",
                    text: "You've received answers for your file "+blob.filename+". You can view your files status on "+global.app.url+"/users/profile/"+fileUser.id+"."
                  };

                  global.email.transporter.sendMail(mailOptions, function(err, info){
                      if(err){
                        next(err);
                        return;
                      }else{
                        console.log('Message sent: ' + info.response);
                      }
                  });
                  /**********************************/
                }
              });

              /* ------------ */
              
              Contestant.findById(req.session.contestant._id, function(err,contestant){
                if(err){
                  next(err);
                  return;
                }
                req.session.contestant = contestant;
              });

              req.flash('answerNotice', 'Your answers were successfully uploaded.');
              res.redirect('/upload/answer/'+blob.id);
              return;

            });
          });
        });
      });
    });
  });

});

router.get('/file/answer/delete/:answerid', global.requireAuth, function(req, res, next){
  var userid = req.session.passport.user;

  var answerid = req.param('answerid');
  answerid = validator.toString(answerid);

  FileAnswer.findById(answerid,function(err,answer){
    if(err){
      next(err);
      return;
    }

    FileAnswer.update({'_id':answer.id},{$set:{'deleted':new Date()}},function(err,answer){
      if(err){
        next(err);
        return;
      }

      req.flash('profileNotice','Answer deleted successfully');
      res.redirect('/profile/'+userid);
      return;
    });
  });

});

module.exports = router;
