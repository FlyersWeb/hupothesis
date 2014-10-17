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


router.get('/answer/:fileinfoid', function(req, res, err) {

  var fileinfoid = req.param('fileinfoid');

  FileInfo.findOne({'_id': fileinfoid, 'deleted':null}, 'filename uptime anstime', function(err, fileInfo){
    if (err)
      next(err);

    if ( !fileInfo ) {
      res.redirect('/');
      return;
    }

    var fileinfo = { id: fileInfo.id, anstime: fileInfo.anstime };

    res.render('answer', { title: 'Hupothesis', error: req.flash('answerError'), notice: req.flash('answerNotice'), fileinfo: fileinfo, captcha_key: global.captcha.public_key, csrf: req.csrfToken() });

  });
});

// Upload answers
router.post('/answer', function(req, res, next) {

  var form = new formidable.IncomingForm();
  form.uploadDir = "./tmp/";
  form.keepExtensions = false;

  form.parse(req, function(err,fields,files){

    var email     = fields.email;

    var ip        = req.ip;
    var challenge = fields.recaptcha_challenge_field;
    var response  = fields.recaptcha_response_field;
    var private_key = global.captcha.private_key;

    if ( !validator.isEmail(email) ) {
      req.flash('answerError', 'Oops, invalid email');
      res.redirect('/answer/'+)
      res.render('answer', { title: 'Hupothesis', upload: false, error: "Invalid Email", captcha_key: global.captcha.public_keys });
    }

    simple_recaptcha(private_key, ip, challenge, response, function(err) {  

      if (err) next(err);

      User.findOne({'email':email,'deleted':null},'id email',function(err,user){
        if(err)
          next(err);

        if ( !user ) {
          var user = new User({'email':email});
          user.save(function(err){
            if(err)
              next(err);
          });
        }

        FileInfo.findOne({'_id':fields.fileinfo,'deleted':null}, 'id userid', function(err,fileInfo){
          if(err)
            next(err);

          if ( !fileInfo ) {
            res.redirect('/');
            return;
          }

          fs.rename(files.answerinfo.path, form.uploadDir+files.answerinfo.filename, function(err){
            if (err)
              next(err);
          });

          AnswerInfo.findOne({'fileid':fileInfo.id,'userid':user.id,'deleted':null}, 'id', function(err, answerInfo){
            if(err)
              next(err);

            if(!answerInfo) {
              answerInfo = new AnswerInfo({'fileid':fileInfo.id,'userid':user.id,'downloaded':Date.now(),'filename':files.answerinfo.name,'comments':fields.comments});
              answerInfo.save(function(err){
                if(err)
                  next(err);
              });
            }

            AnswerInfo.update({'fileid':fileInfo.id,'userid':user.id}, {'filename':files.answerinfo.name,'comments':fields.comments}, {}, function(err){
              if(err)
                next(err);
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
                }else{
                  console.log('Message sent: ' + info.response);
                }
            });

            User.findOne({'_id':fileInfo.userid,'deleted':null}, 'id email', function(err,fileUser){
              if ( err )
                next(err);

              if ( fileUser )
              {
                var mailOptions = {
                  from: global.email.user,
                  to: ''+fileUser.email+', '+global.email.user+'',
                  subject: "[Hupothesis] Answers uploaded",
                  text: "You've received answers for your file "+fileInfo.filename+". You can view your files status on "+global.app.url+"/users/profile/"+fileUser.id+"."
                };

                global.email.transporter.sendMail(mailOptions, function(err, info){
                    if(err){
                      next(err);
                    }else{
                      console.log('Message sent: ' + info.response);
                    }
                });
              }
            });

            /* ------------ */
            
            req.flash('answerNotice', 'Answer uploaded with success');
            res.redirect('/answer/'+fileinfo.id);

          });
        });
      });
    });
  });

});

module.exports = router;
