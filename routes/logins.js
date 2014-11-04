var express = require("express");
var router = express.Router();

var validator = require('validator');
var passport = require("passport");

var simple_recaptcha = require('simple-recaptcha');

var global = require('../configuration/global.js');

var User = require('../models/user');

router.get('/login', function(req, res, next){
  res.render('login', { csrf: req.csrfToken(), captcha_key: global.captcha.public_key, error: req.flash('loginError'), notice: req.flash('loginNotice') } );
});

router.get('/logout', function(req, res, next){
  req.logout();
  res.redirect('/login');
});

router.post('/login',
  passport.authenticate('local', {failureRedirect: '/login', failureFlash:'Invalid user email or password'}),
  function(req, res, next){
    var ip = req.ip;
    var challenge = req.body.recaptcha_challenge_field;
    var response = req.body.recaptcha_response_field;
    var private_key = global.captcha.private_key;

    simple_recaptcha(private_key, ip, challenge, response, function(err) {
      if(err) next(err);

      req.flash('loginNotice', 'Logged in with succes.');
      res.redirect('/login');

    });
  });

module.exports = router;