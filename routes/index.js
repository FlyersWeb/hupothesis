var express = require('express');
var router = express.Router();

var global = require('../configuration/global.js');


/* GET home page. */
router.get('/', function(req, res) {
  // res.redirect('/launch');

  res.render('index', { notice: req.flash('uploadNotice'), error: req.flash('uploadError'), captcha_key: global.captcha.public_key, csrf: req.csrfToken() });
});

module.exports = router;
