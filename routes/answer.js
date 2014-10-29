var express = require('express');
var router = express.Router();

var formidable = require('formidable');
var fs = require('fs-extra');

var validator = require('validator');

var simple_recaptcha = require('simple-recaptcha');

var global = require('../configuration/global.js');

var User = require('../models/user.js');
var FileInfo = require('../models/fileinfo.js');
var AnswerInfo = require('../models/answerinfo.js');


validator.extend('isExtSupported', function(str){
  if (global.app.fileExts.indexOf(str)>-1) return true;
  return false;
});

router.get('/answer/:fileinfoid', function(req, res, err) {

  var fileinfoid = req.param('fileinfoid');

  FileInfo.findOne({'_id': fileinfoid, 'deleted':null}, 'filename uptime anstime', function(err, fileInfo){
    if (err) {
      next(err);
      return;
    }

    if ( !fileInfo ) {
      res.redirect('/');
      return;
    }

    res.render('answer', { error: req.flash('answerError'), notice: req.flash('answerNotice'), fileinfo: fileInfo.toObject(), user: req.session.contestant, captcha_key: global.captcha.public_key, csrf: req.csrfToken() });

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

    var extension = path.extname(files.fileinfo.name);
    if( !validator.isExtSupported(extension) ) {
      req.flash('uploadError', 'Oops, invalid file type, we only support '+global.app.fileExts.join(', '));
      res.redirect('/upload');
      return;
    }

    simple_recaptcha(private_key, ip, challenge, response, function(err) {  

      if (err) {
        next(err);
        return;
      }

      User.findOne({'email':email,'deleted':null},'id email',function(err,user){
        if(err) {
          next(err);
          return;
        }

        if ( !user ) {
          var user = new User({'email':email});
          user.save(function(err){
            if(err) {
              next(err);
              return;
            }
          });
        }

        req.session.contestant = user.toObject();

        FileInfo.findOne({'_id':fileid,'deleted':null}, 'id userid', function(err,fileInfo){
          if(err) {
            next(err);
            return;
          }

          if ( !fileInfo ) {
            res.redirect('/');
            return;
          }

          fs.rename(files.answerinfo.path, form.uploadDir+files.answerinfo.filename, function(err){
            if (err) {
              next(err);
              return;
            }
          });

          AnswerInfo.findOne({'fileid':fileInfo.id,'userid':user.id,'deleted':null}, 'id', function(err, answerInfo){
            if(err) {
              next(err);
              return;
            }

            if(!answerInfo) {
              answerInfo = new AnswerInfo({'fileid':fileInfo.id,'userid':user.id,'downloaded':Date.now(),'filename':files.answerinfo.name,'comments':fields.comments});
              answerInfo.save(function(err){
                if(err) {
                  next(err);
                  return;
                }
              });
            }

            AnswerInfo.update({'fileid':fileInfo.id,'userid':user.id}, {'filename':files.answerinfo.name,'comments':fields.comments}, {}, function(err){
              if(err) {
                next(err);
                return;
              }
            });

            /*  --- Email Notification ---  */
            var mailOptions = {
              from: global.email.user,
              to: ''+user.email+', '+global.email.user+'',
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

            User.findOne({'_id':fileInfo.userid,'deleted':null}, 'id email', function(err,fileUser){
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
                  text: "You've received answers for your file "+fileInfo.filename+". You can view your files status on "+global.app.url+"/users/profile/"+fileUser.id+"."
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
            res.redirect('/answer/'+fileInfo.id);
            return;
          });
        });
      });
    });
  });

});

module.exports = router;
