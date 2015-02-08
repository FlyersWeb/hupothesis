var express = require('express');
var router = express.Router();

var validator = require('validator');

var formidable = require('formidable');
var path = require('path');
var fs = require('fs-extra');

var _ = require('underscore');

var simple_recaptcha = require('simple-recaptcha');

var global = require('../configuration/global.js');

var User = require('../models/user.js');
var Blob = require('../models/blob.js');

// validator.extend('isTimeUp', function(str){
//   return /(\d+)?d?(\d+)h(\d+)?m?/.test(str);
// });

validator.extend('isExtSupported', function(str){
  if (global.app.fileExts.indexOf(str)>-1) return true;
  return false;
});

/* GET home page. */
router.get('/upload', global.requireAuth, function(req, res, next) {

  User.findOne({'_id':req.session.passport.user,'deleted':null}, function(err, user){
    if(err) {
      next(err);
      return;
    }
    res.render('upload', { options: req.flash('uploadOptions')[0], user: user.toObject(), notice: req.flash('uploadNotice'), error: req.flash('uploadError'), captcha_key: global.captcha.public_key, csrf: req.csrfToken() });
  });

});

// Upload test
router.post('/upload', global.requireAuth, function(req, res, next) {

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

    var extension = path.extname(files.fileinfo.name);
    if( !validator.isExtSupported(extension) ) {
      req.flash('uploadError', 'Oops, invalid file type, we only support '+global.app.fileExts.join(', '));
      res.redirect('/upload');
      return;
    }

    var title = validator.toString(fields.title);
    var instruction = validator.toString(fields.instruction);

    var tag = validator.toString(fields.tags);
    var tags = tag.split(',');
    tags = _.map(tags,function(el){return el.trim();});

    // if ( !validator.isTimeUp(fields.timeup) ) {
    //   req.flash('uploadError', 'Oops, invalid answer time !');
    //   res.redirect('/');
    //   return;
    // }

    User.findOne({'_id':req.session.passport.user, 'deleted':null}, function(err, user){
      if (err) {
        next(err);
        return;
      }

      if(!user) {
        req.flash('uploadError', 'Oops ! Unknown User');
        res.redirect('/upload');
        return;
      }

      if ( !validator.isEmail(user.local.email) ) {
        req.flash('uploadError', 'Oops, invalid email !');
        res.redirect('/upload');
        return;
      }

      var blob = new Blob({'user':user.id,'tags':tags,'title':title,'instruction':instruction,'kind':'file','filename':files.fileinfo.name});
      blob.save(function(err){
        if(err) {
          next(err);
          return;
        }

        fs.rename(files.fileinfo.path, form.uploadDir+blob.id, function(err){
          if (err) {
            next(err);
            return;
          }
        });

        /*  --- Email Notification ---  */
        var mailOptions = {
          from: global.email.user,
          to: ''+user.local.email+', '+global.email.user+'',
          subject: "[Hupothesis] File uploaded with success",
          text: "Congratulations, you've successfully uploaded "+files.fileinfo.name+". You can share it using "+global.app.url+"/answer/"+blob.id+"."
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

        var options = { fileid: blob.id, userid: user.id, url:global.app.url };

        req.flash('uploadNotice', 'Your file was uploaded with success');
        req.flash('uploadOptions', options);
        res.redirect('/upload');
        return;

      });
    });
  });
});

router.get('/file/delete/:fileid', global.requireAuth, function(req, res, next){
  var userid = req.session.passport.user;

  var fileid = req.param('fileid');
  fileid = validator.toString(fileid);

  Blob.findOne({'_id':fileid,'kind':'file','deleted':null},function(err,blob){
    if(err){
      next(err);
      return;
    }

    if(!blob) {
      req.flash('profileError','File not found !');
      res.redirect('/profile/'+userid);
      return;
    }

    Blob.update({'_id':blob.id},{'deleted':new Date()},{},function(err,blob){
      if(err){
        next(err);
        return;
      }
      req.flash('profileNotice','File deleted successfully');
      res.redirect('/profile/'+userid);
      return;
    });
  });

});

module.exports = router;
