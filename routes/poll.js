var express = require('express');
var router = express.Router();

var global = require('../configuration/global.js');


/* GET home page. */
router.get('/poll', function(req, res) {
  res.render('poll', { notice: req.flash('pollNotice'), error: req.flash('pollError'), captcha_key: global.captcha.public_key, csrf: req.csrfToken() });
});

module.exports = router;
