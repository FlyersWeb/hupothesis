var express = require('express');
var router = express.Router();

var validator = require('validator');

var simple_recaptcha = require('simple-recaptcha');

var global = require('../configuration/global.js');

var Contestant = require('../models/contestant.js');

/* GET contact page. */
router.get('/contact', function(req, res) {
  res.render('contact', { title: 'Contact us', error: req.flash('contactError'), notice: req.flash('contactNotice'), captcha_key: global.captcha.public_key, csrf: req.csrfToken() });
});


router.post('/contact', function(req, res, next) {

  var email = req.body.email;
  var subject = req.body.subject;
  var comments = req.body.comments;

  var ip = req.ip;
  var challenge = req.body.recaptcha_challenge_field;
  var response = req.body.recaptcha_response_field;
  var private_key = global.captcha.private_key;

  if ( !validator.isEmail(email) ) {
    req.flash('contactError', 'Oops, invalid Email address !');
    res.redirect('/contact');
  }

  subject = validator.toString(subject);
  comments = validator.toString(comments);

  simple_recaptcha(private_key, ip, challenge, response, function(err) {
    
    if (err) next(err);

    Contestant.findOne({'email':email, deleted:null}, function(err, contestant){
      if (err) {
        next(err);
      }

      if ( !contestant ) {
        contestant = new Contestant({'email': email});
        contestant.save(function(err){
          if(err)
            next(err);
        });
      }

      /* ------------- Email -------------- */
      var mailOptions = {
        from: global.email.user,
        to: ''+email+', '+global.email.user+'',
        subject: "[Hupothesis] Message successfully sent",
        text: "Congratulations, we've received your contact request we'll respond as soon as possible.\nThanks."
      };

      global.email.transporter.sendMail(mailOptions, function(err, info){
          if(err){
            next(err);
          }else{
            if(info){
              console.log('Message sent: ' + info.response);
            }
          }
      });


      var mailOptions = {
        from: email,
        to: ''+global.email.user+'',
        subject: "[Hupothesis] "+subject,
        text: comments
      };

      global.email.transporter.sendMail(mailOptions, function(err, info){
          if(err){
            next(err);
          }else{
            if(info){
              console.log('Message sent: ' + info.response);
            }
          }
      });
      /* ------------ */

      req.flash('contactNotice', 'Message sent with success');
      res.redirect('/contact');

    });

  });
});


module.exports = router;