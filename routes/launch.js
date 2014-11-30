var express = require('express');
var router = express.Router();

var global = require('../configuration/global.js');

var simple_recaptcha = require('simple-recaptcha');

var validator = require('validator');

var User = require('../models/user.js');

/* GET launch page. */
router.get('/launch', function(req, res) {
  res.render('launch', { title: 'Launching', notice: req.flash('launchNotice'), error: req.flash('launchError'), captcha_key: global.captcha.public_key, csrf: req.csrfToken() });
});

// Post launch newsletter
router.post('/launch', function(req, res, next) {

  var email = req.body.email;

  var ip = req.ip;
  var challenge = req.body.recaptcha_challenge_field;
  var response = req.body.recaptcha_response_field;
  var private_key = global.captcha.private_key;

  if ( !validator.isEmail(email) ) {
    req.flash('launchError', 'Oops, invalid Email address');
    res.redirect('/launch');
  }

  simple_recaptcha(private_key, ip, challenge, response, function(err) {
    
    if (err) next(err);
    
    User.findOne({'email':email, 'deleted':null},function(err, user){
      if (err) next(err);

      if ( !user ) {
        user = new User({email: email});
        user.save(function(err){
          if(err) next(err);
        });
      }

      /* ------------- Email -------------- */
      var mailOptions = {
        from: global.email.user,
        to: ''+email+', '+global.email.user+'',
        subject: "[Hupothesis] Newsletter subscription",
        text: "Congratulations, we've received your request to be informed when Hupothesis will be online. We're working hard to let you access our service as soon as possible.\nFeel free to contact us when you need.\nThanks.\nYou can unsubscribe to our service using the link : "+global.app.url+"/users/unsubscribe/"+user.id
      };

      global.email.transporter.sendMail(mailOptions, function(error, info){
          if(err){
            next(err);
          }else{
            console.log('Message sent: ' + info.response);
          }
      });
      /* ------------ */

      req.flash('launchNotice', 'Your request has been taken in account');
      res.redirect('/launch');

    });

  });

});

module.exports = router;
