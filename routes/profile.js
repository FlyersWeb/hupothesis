var express = require('express');
var router = express.Router();

var validator = require('validator');

var global = require('../configuration/global.js');

var User = require('../models/user.js');


router.get('/profile/:userid', global.requireAuth, function(req, res, next){
  res.render('profile');
});

module.exports = router;