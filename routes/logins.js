var express = require("express");
var router = express.Router();

var validator = require('validator');
var passport = require("passport");

var simple_recaptcha = require('simple-recaptcha');

var global = require('../configuration/global.js');

var UserRole = require('../models/userrole');

router.get('/login', function(req, res, next){
  res.render('login', { csrf: req.csrfToken(), error: req.flash('loginError'), notice: req.flash('loginNotice') } );
});

router.get('/register', function(req, res, next){
  res.render('register', { csrf: req.csrfToken(), captcha_key: global.captcha.public_key, error: req.flash('loginError'), notice: req.flash('loginNotice') } );
});

router.get('/logout', function(req, res, next){
  req.logout();
  res.redirect('/');
});

router.post('/login',
  passport.authenticate('local', {failureFlash:'Invalid user email or password'}),
  function(req, res, next){
    res.json({id:req.user.id, email:req.user.local.email});
  });

router.post('/register', function(req, res, next){
  var email = req.body.email
  var password = req.body.password;
  var confirm = req.body.confirm;

  var ip = req.ip;
  var challenge = req.body.recaptcha_challenge_field;
  var response = req.body.recaptcha_response_field;
  var private_key = global.captcha.private_key;

  password  = validator.toString(password);
  confirm   = validator.toString(confirm);

  if ( !validator.isEmail(email) ) {
    req.flash('registerError', 'Invalid email address');
    next();
  }

  if (password != confirm) {
    req.flash('registerError', 'Invalid password confirmation');
    next();
  }  

  simple_recaptcha(private_key, ip, challenge, response, function(err) {

    UserRole.findOne({'local.email':email,deleted:null},function(err,user){
      if(err) next(err);
      if(user){
        req.flash('registerError','Email already in use.');
        next();
      }

      var ret = UserRole.generateHash(password, function(err,hash,salt){
        if (err)
          next(err);
        var newUser = new UserRole({'local.email':email,'local.password':hash,'local.salt':salt});
        newUser.save(function(err){
          if(err)
            next(err);
          req.flash('registerNotice', 'Account registered with success');
          res.render('register', { error: req.flash('registerError'), notice: req.flash('registerNotice') } );
        });
      });
    });

  });
});

module.exports = router;