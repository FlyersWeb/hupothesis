var express = require('express');
var router = express.Router();

var validator = require('validator');

var fs = require('fs-extra');

var simple_recaptcha = require('simple-recaptcha');

var global = require('../configuration/global.js');

var User = require('../models/user.js');
var FileInfo = require('../models/fileinfo.js');
var AnswerInfo = require('../models/answerinfo.js');

router.get('/getfile', function(req, res, next){

  var fileinfo = req.flash('fileinfo')[0];
  var user = req.session.contestant;

  var email = user.email;

  if ( !validator.isEmail(email) ) {
    req.flash("answerError", "Oops, invalid email address");
    res.redirect('/answer/'+fileinfoid);
    return;
  }

  User.findOne({'email':email,'deleted':null}, 'id email', function(err, user){
    if (err) {
      next(err);
      return;
    }

    if(!user) {
      req.flash('downloadError', 'Oops, unknown user');
      res.redirect('/download/'+fileinfo._id);
      return;
    }

    FileInfo.findOne({'_id':fileinfo._id,'deleted':null}, 'id userid uptime anstime filename downloaded', function(err,fileInfo){

      if ( !fileInfo ) {
        req.flash('answerError', "Oops, invalid file identifier");
        res.redirect('/answer/'+fileinfo._id);
        return;
      }

      AnswerInfo.update({'fileid':fileInfo.id,'userid':user.id}, { 'downloaded': new Date() }, {'upsert':true}, function(err){
        if(err) {
          next(err);
          return;
        }
      });

      var filePath = './tmp/'+fileInfo.id;
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
            return;
          }else{
            console.log('Message sent: ' + info.response);
          }
      });
      /*  --- --- ---  */

      return;
    });

  });

});


router.get('/download/:fileinfoid', function(req, res, next){

  var fileinfoid = req.param('fileinfoid');

  fileinfoid = validator.toString(fileinfoid);

  FileInfo.findOne({'_id':fileinfoid,'deleted':null}, 'id userid uptime anstime filename downloaded', function(err,fileInfo){
    if (err) {
      next(err);
      return;
    }

    if( !fileInfo ) {
      req.flash('answerError', 'Oops, unknown file identifier !');
      res.redirect('/answer/'+fileinfoid);
      return;
    }

    req.flash('fileinfo', fileInfo.toObject());
    if (req.session.contestant) {
      res.redirect('/getfile');
      return;
    }

    res.render('download', {error: req.flash('downloadError'), notice: req.flash('downloadNotice'), fileinfo: fileInfo.toObject(), captcha_key: global.captcha.public_key, csrf:req.csrfToken() });

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
    req.flash('answerError', 'Oops, invalid email address.');
    res.redirect('/answer/'+fileinfoid);
    return;
  }

  simple_recaptcha(private_key, ip, challenge, response, function(err) {  

    if (err) {
      next(err);
      return;
    }

    User.findOne({'email':email,'deleted':null}, 'id email', function(err, user){
      if (err) {
        next(err);
        return;
      }

      if( !user ) {
        user = new User({'email': email});
        user.save(function(err){
          if(err) {
            next(err);
            return;
          }
        });
      }

      req.session.contestant = user;

      res.redirect('/getfile');
      return;
    });
  });
});

module.exports = router;
