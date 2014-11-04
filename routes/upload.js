var express = require('express');
var router = express.Router();

var validator = require('validator');

var formidable = require('formidable');
var path = require('path');
var fs = require('fs-extra');

var simple_recaptcha = require('simple-recaptcha');

var global = require('../configuration/global.js');

var User = require('../models/user.js');
var File = require('../models/file.js');
var Blob = require('../models/blob.js');

// validator.extend('isTimeUp', function(str){
//   return /(\d+)?d?(\d+)h(\d+)?m?/.test(str);
// });

validator.extend('isExtSupported', function(str){
  if (global.app.fileExts.indexOf(str)>-1) return true;
  return false;
});

/* GET home page. */
router.get('/upload', function(req, res) {
  if(!req.session.passport.user) {
    res.redirect('/login');
    return;
  }

  User.findOne({'_id':req.session.passport.user}, function(err, user){
    if(err) {
      next(err);
      return;
    }
    res.render('upload', { options: req.flash('uploadOptions')[0], notice: req.flash('uploadNotice'), error: req.flash('uploadError'), user: user.toObject(), captcha_key: global.captcha.public_key, csrf: req.csrfToken() });
  });

});

// Upload test
router.post('/upload', function(req, res, next) {
  if(!req.session.passport.user) {
    res.redirect('/login');
    return;
  }

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

  form.parse(req, function(err, fields, files){
    if (err) {
      next(err);
      return;
    }

    var ip        = req.ip;
    var challenge = fields.recaptcha_challenge_field;
    var response  = fields.recaptcha_response_field;
    var private_key = global.captcha.private_key;

    if ( !validator.isEmail(fields.email) ) {
      req.flash('uploadError', 'Oops, invalid email !');
      res.redirect('/upload');
      return;
    }

    var extension = path.extname(files.fileinfo.name);
    if( !validator.isExtSupported(extension) ) {
      req.flash('uploadError', 'Oops, invalid file type, we only support '+global.app.fileExts.join(', '));
      res.redirect('/upload');
      return;
    }

    var tag = validator.toString(fields.tags);
    var tags = tag.split(',');

    // if ( !validator.isTimeUp(fields.timeup) ) {
    //   req.flash('uploadError', 'Oops, invalid answer time !');
    //   res.redirect('/');
    //   return;
    // }

    simple_recaptcha(private_key, ip, challenge, response, function(err) {

      if (err) {
        next(err);
        return;
      } 

      User.findOne({'email':fields.email, deleted:null}, 'id email deleted updated added', function(err, user){
        if (err) {
          next(err);
          return;
        }

        if ( !user ) {
          user = new User({email:fields.email});
          user.save(function(err){
            if(err) {
              next(err);
              return;
            }
          });
        }

        var blob = new Blob({user:user.id,tags:tags});
        blob.save(function(err){
          if(err) {
            next(err);
            return;
          }

          var file = new File({blob:blob.id,filename:files.fileinfo.name});
          file.save(function(err){
            if(err) {
              next(err);
              return;
            }

            fs.rename(files.fileinfo.path, form.uploadDir+file.id, function(err){
              if (err) {
                next(err);
                return;
              }
            });

            /*  --- Email Notification ---  */
            var mailOptions = {
              from: global.email.user,
              to: ''+fields.email+', '+global.email.user+'',
              subject: "[Hupothesis] File uploaded with success",
              text: "Congratulations, you've successfully uploaded "+files.fileinfo.name+". You can share it using "+global.app.url+"/answer/"+file.id+"."
            };

            global.email.transporter.sendMail(mailOptions, function(err, info){
                if(err){
                  next(err);
                  return;
                }else{
                  console.log('Message sent: ' + info.response);
                }
            });
            /* ------------ */

            var options = { fileid: file.id, userid: user.id, url:global.app.url, filetype: "download" };

            req.flash('uploadNotice', 'Your file was uploaded with success');
            req.flash('uploadOptions', options);
            res.redirect('/upload');
            return;

          });

        });

        // var fileInfo = new FileInfo({userid:user.id,filename:files.fileinfo.name,anstime:fields.timeup});
        // var fileInfo = new FileInfo({userid:user.id,filename:files.fileinfo.name});
        // fileInfo.save(function(err){
        //   if(err) {
        //     next(err);
        //     return;
        //   }
        // });

      });
    });
  });

});

module.exports = router;
