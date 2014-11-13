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
var File = require('../models/file.js');
var Answer = require('../models/fileanswer.js');
var Contestant = require('../models/contestant.js');


validator.extend('isExtSupported', function(str){
  if (global.app.fileExts.indexOf(str)>-1) return true;
  return false;
});

router.get('/answer/:fileinfoid', function(req, res, err) {

  var fileinfoid = req.param('fileinfoid');

  File.findOne({'_id': fileinfoid, 'deleted':null}, function(err, file){
    if (err) {
      next(err);
      return;
    }

    if ( !file ) {
      res.redirect('/');
      return;
    }

    if (req.session.contestant) {
      Answer.findOne({'contestant':req.session.contestant._id,'file':file.id,'filename':{$exists:true}},function(err,answer){
        if(err) {
          next(err);
          return;
        }

        if(answer) {
          req.flash('answerNotice', "You've already answered the test.");
          res.render('answer', { error: req.flash('answerError'), notice: req.flash('answerNotice')});
        } else {
          res.render('answer', { error: req.flash('answerError'), notice: req.flash('answerNotice'), fileinfo: file.toObject(), contestant: req.session.contestant, captcha_key: global.captcha.public_key, csrf: req.csrfToken() });    
        }
      });
    }
    else {
      res.render('answer', { error: req.flash('answerError'), notice: req.flash('answerNotice'), fileinfo: file.toObject(), contestant: req.session.contestant, captcha_key: global.captcha.public_key, csrf: req.csrfToken() });
    }

  });
});

// Upload answers
router.post('/answer', function(req, res, next) {

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
      res.redirect('/answer/'+fileid);
      return;
    }

    var extension = path.extname(files.answerinfo.name);
    if( !validator.isExtSupported(extension) ) {
      req.flash('answerError', 'Oops, invalid file type, we only support '+global.app.fileExts.join(', '));
      res.redirect('/upload');
      return;
    }

    simple_recaptcha(private_key, ip, challenge, response, function(err) {  

      if (err) {
        next(err);
        return;
      }

      Contestant.findOne({'email':email,'deleted':null},function(err,contestant){
        if(err) {
          next(err);
          return;
        }
        if(!contestant){
          var contestant = new Contestant({'email':email});
          contestant.save(function(err){
            if(err) {
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

        File.findOne({'_id':fileid,'deleted':null}, function(err,file){
          if(err) {
            next(err);
            return;
          }

          if ( !file ) {
            res.redirect('/');
            return;
          }

          fs.rename(files.answerinfo.path, form.uploadDir+files.answerinfo.filename, function(err){
            if (err) {
              next(err);
              return;
            }
          });

          Answer.findOne({'file':file.id,'contestant':contestant.id,'deleted':null}, 'id', function(err, answer){
            if(err) {
              next(err);
              return;
            }

            if(!answer) {
              answer = new Answer({'file':file.id,'contestant':contestant.id,'downloaded':Date.now(),'filename':files.answerinfo.name,'comments':fields.comments});
              answer.save(function(err){
                if(err) {
                  next(err);
                  return;
                }
              });
            }

            Answer.update({'file':file.id,'contestant':contestant.id}, {'filename':files.answerinfo.name,'comments':fields.comments}, {}, function(err){
              if(err) {
                next(err);
                return;
              }
            });

            if(!req.session.contestant)
            req.session.contestant = contestant;

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

            Blob.findOne({'_id':file.blob,'deleted':null}, function(err,blob){

              if(err) {
                next(err);
                return;
              }

              if(!blob){
                var err = new Error("Invalid file blob");
                err.status = 500;
                next(err);
                return;
              }

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
                    text: "You've received answers for your file "+file.filename+". You can view your files status on "+global.app.url+"/users/profile/"+fileUser.id+"."
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
              
              req.flash('answerNotice', 'Answer uploaded with success');
              res.redirect('/answer/'+file.id);
              return;

            });
          });
        });
      });
    });
  });

});

module.exports = router;
