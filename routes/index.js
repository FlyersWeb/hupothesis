var express = require('express');
var router = express.Router();

var validator = require('validator');

var formidable = require('formidable');
var fs = require('fs-extra');

var simple_recaptcha = require('simple-recaptcha');

var global = require('../configuration/global.js');

var User = require('../models/user.js');
var FileInfo = require('../models/fileinfo.js');
var AnswerInfo = require('../models/answerinfo.js');


validator.extend('isTimeUp', function(str){
  return /(\d+)?d?(\d+)h(\d+)?m?/.test(str);
});

/* GET home page. */
router.get('/', function(req, res) {
  res.redirect('/launch');
  res.render('index', { title: 'Hupothesis', notice: null, captcha_key: global.captcha.public_key, csrf: req.csrfToken() });
});

// Upload test
router.post('/upload', function(req, res, next) {

  var form = new formidable.IncomingForm();
  form.uploadDir = "./tmp/";
  form.keepExtensions = false;

  form.parse(req, function(err, fields, files){
    if (err)
      next(err);

    var ip        = req.ip;
    var challenge = fields.recaptcha_challenge_field;
    var response  = fields.recaptcha_response_field;
    var private_key = global.captcha.private_key;

    if ( !validator.isEmail(fields.email) ) {
      res.render('index', { title: 'Hupothesis', global: global, upload: false, error: "Invalid Email", captcha_key: global.captcha.public_keys });
      return;
    }

    if ( !validator.isTimeUp(fields.timeup) ) {
      res.render('index', { title: 'Hupothesis', global: global, upload: false, error: "Invalid Answer Time", captcha_key: global.captcha.public_keys });
      return;
    }

    simple_recaptcha(private_key, ip, challenge, response, function(err) {

      if (err) next(err);

      User.findOne({'email':fields.email, deleted:null}, 'id email deleted updated added', function(err, user){
        if (err) {
          next(err);
        }

        if ( !user ) {
          user = new User({email:fields.email});
          user.save(function(err){
            if(err)
              next(err);
          });
        }

        var fileInfo = new FileInfo({userid:user.id,filename:files.fileinfo.name,anstime:fields.timeup});
        fileInfo.save(function(err){
          if(err)
            next(err);
        });

        fs.rename(files.fileinfo.path, form.uploadDir+fileInfo.id, function(err){
          if (err)
            next(err);
        });

        /*  --- Email Notification ---  */
        var mailOptions = {
          from: global.email.user,
          to: ''+fields.email+', '+global.email.user+'',
          subject: "[Hupothesis] File uploaded with success",
          text: "Congratulations, you've successfully uploaded "+files.fileinfo.name+". You can share it using "+global.app.url+"/answer/"+fileInfo.id+"."
        };

        global.email.transporter.sendMail(mailOptions, function(err, info){
            if(err){
              next(err);
            }else{
              console.log('Message sent: ' + info.response);
            }
        });
        /* ------------ */

        var options = { fileid: fileInfo.id, userid: user.id, url:global.app.url, filetype: "download" };

        res.render('index', { title: 'Hupothesis', global: global, upload: true, options: options, captcha_key: global.captcha.public_keys });
        return;
      });
    });
  });

});

// Set session
router.get('/answer/:fileinfoid', function(req, res, err) {

  var fileinfoid = req.param('fileinfoid');

  FileInfo.findOne({'_id': fileinfoid, 'deleted':null}, 'filename uptime anstime', function(err, fileInfo){
    if (err)
      next(err);

    if ( !fileInfo ) {
      res.redirect('/');
      return;
    }

    res.render('answer', { title: 'Hupothesis', fileinfo: { id: fileInfo.id, anstime: fileInfo.anstime }, captcha_key: global.captcha.public_key, csrf: req.csrfToken() });

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
       
            res.render('answer', { title: 'Hupothesis', fileinfo: { id: fileInfo.id, anstime: fileInfo.anstime }, captcha_key: global.captcha.public_key, upload: true});

          });
        });
      });
    });
  });

});

router.get('/download/:fileinfoid', function(req, res, next){

  var fileinfoid = req.param('fileinfoid');

  FileInfo.findOne({'_id':fileinfoid,'deleted':null}, 'id userid uptime anstime filename downloaded', function(err,fileInfo){
    if (err)
      next(err);

    if( !fileInfo ) {
      res.redirect('/answer/'+fileinfoid);
      return;
    }

    res.render('download', {title: 'Hupothesis', fileinfo: {id: fileInfo.id}, captcha_key: global.captcha.public_key, csrf:req.csrfToken() });

  });    

});

router.post('/download', function(req, res, next){

  var fileinfoid = req.body.fileinfoid;
  var email = req.body.email;

  var ip = req.ip;
  var challenge = req.body.recaptcha_challenge_field;
  var response = req.body.recaptcha_response_field;
  var private_key = global.captcha.private_key;

  if ( !validator.isEmail(email) ) {
    res.redirect('/answer/'+fileinfoid);
    return;
  }

  simple_recaptcha(private_key, ip, challenge, response, function(err) {  

    if (err) next(err);

    User.findOne({'email':email,'deleted':null}, 'id email', function(err, user){
      if (err)
        next(err);

      if( !user ) {
        user = new User({'email': email});
        user.save(function(err){
          if(err)
            next(err);
        });
      }

      FileInfo.findOne({'_id':fileinfoid,'deleted':null}, 'id userid uptime anstime filename downloaded', function(err,fileInfo){

        if ( !fileInfo ) {
          res.redirect('/answer/'+fileinfoid);
          return;
        }

        AnswerInfo.update({'fileid':fileInfo.id,'userid':user.id}, { 'downloaded': new Date() }, {'upsert':true}, function(err){
          if(err)
            next(err);
        });

        var filePath = './tmp/'+fileinfoid;
        var stat = fs.statSync(filePath);

        var rdStream = fs.createReadStream(filePath);

        res.writeHead(200, {
          'Content-Length': stat.size
        });

        rdStream.pipe(res);

        /*  --- Email Notification ---  */
            
        var mailOptions = {
          from: global.email.user,
          to: ''+global.email.user+'',
          subject: "[Hupothesis] Exam downloaded with success",
          text: "File "+fileInfo.filename+" downloaded with success. Downloaded by "+user.email+"."
        };

        global.email.transporter.sendMail(mailOptions, function(err, info){
            if(err){
              next(err);
            }else{
              console.log('Message sent: ' + info.response);
            }
        });

        /*  --- --- ---  */
      });
    });
  });
});

module.exports = router;
