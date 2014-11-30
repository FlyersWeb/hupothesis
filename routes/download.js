var express = require('express');
var router = express.Router();

var validator = require('validator');

var fs = require('fs-extra');

var simple_recaptcha = require('simple-recaptcha');

var global = require('../configuration/global.js');

var User = require('../models/user.js');
var Blob = require('../models/blob.js');
var File = require('../models/file.js');
var Answer = require('../models/fileanswer.js');
var Contestant = require('../models/contestant.js');


router.get('/getfile/:fileinfoid', function(req, res, next){


  var fileinfoid = req.param('fileinfoid');
  fileinfoid = validator.toString(fileinfoid);

  var email = req.session.contestant.email;

  if ( !validator.isEmail(email) ) {
    req.flash("answerError", "Oops, invalid email address");
    res.redirect('/upload/answer/'+fileinfoid);
    return;
  }

  Contestant.findOne({'email':email,'deleted':null}, function(err, contestant){
    if (err) {
      next(err);
      return;
    }

    if(!contestant) {
      req.flash('answerError', 'Oops, unknown user');
      res.redirect('/download/'+fileinfoid);
      return;
    }

    File.findOne({'_id':fileinfoid,'deleted':null}, function(err,file){

      if ( !file ) {
        req.flash('answerError', "Oops, invalid file identifier");
        res.redirect('/upload/answer/'+fileinfoid);
        return;
      }

      Answer.update({'file':file.id,'contestant':contestant.id}, { 'downloaded': new Date() }, {'upsert':true}, function(err){
        if(err) {
          next(err);
          return;
        }
      });

      var filePath = './tmp/'+file.id;
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
        text: "File "+file.filename+" downloaded with success. Downloaded by "+contestant.email+"."
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

  File.findOne({'_id':fileinfoid,'deleted':null}, function(err,file){
    if (err) {
      next(err);
      return;
    }

    if( !file ) {
      req.flash('answerError', 'Oops, unknown file identifier !');
      res.redirect('/upload/answer/'+fileinfoid);
      return;
    }

    if (req.session.contestant) {
      res.redirect('/getfile/'+fileinfoid);
      return;
    }

    res.render('download', {error: req.flash('downloadError'), notice: req.flash('downloadNotice'), fileinfo: file.toObject(), captcha_key: global.captcha.public_key, csrf:req.csrfToken() });

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
    res.redirect('/upload/answer/'+fileinfoid);
    return;
  }

  simple_recaptcha(private_key, ip, challenge, response, function(err) {  

    if (err) {
      next(err);
      return;
    }

    var contestant = new Contestant({'email':email});
    contestant.save(function(err){
      if(err) {
        next(err);
        return;
      }

      User.findOne({'email':email,'deleted':null}, function(err,user){
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

      req.session.contestant = contestant;

      res.redirect('/getfile/'+fileinfoid);
      return;
    });
  });
});

module.exports = router;
