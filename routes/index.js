var express = require('express');
var router = express.Router();

var validator = require('validator');

var formidable = require('formidable');
var fs = require('fs-extra');

var simple_recaptcha = require('simple-recaptcha');

var global = require('../configuration/global.js');

var User = require('../models/user.js');
var FileInfo = require('../models/fileinfo.js');

// validator.extend('isTimeUp', function(str){
//   return /(\d+)?d?(\d+)h(\d+)?m?/.test(str);
// });

/* GET home page. */
router.get('/', function(req, res) {
  // res.redirect('/launch');

  res.render('index', { options: req.flash('uploadOptions')[0], notice: req.flash('uploadNotice'), error: req.flash('uploadError'), captcha_key: global.captcha.public_key, csrf: req.csrfToken() });
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
      req.flash('uploadError', 'Oops, invalid email !');
      res.redirect('/');
      return;
    }

    // if ( !validator.isTimeUp(fields.timeup) ) {
    //   req.flash('uploadError', 'Oops, invalid answer time !');
    //   res.redirect('/');
    //   return;
    // }

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

        // var fileInfo = new FileInfo({userid:user.id,filename:files.fileinfo.name,anstime:fields.timeup});
        var fileInfo = new FileInfo({userid:user.id,filename:files.fileinfo.name});
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

        req.flash('uploadNotice', 'Your file was uploaded with success');
        req.flash('uploadOptions', options);
        res.redirect('/');
        return;
      });
    });
  });

});

module.exports = router;
