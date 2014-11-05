var express = require('express');
var router = express.Router();

var global = require('../configuration/global.js');


/* GET home page. */
router.get('/poll', global.requireAuth, function(req, res) {
  res.render('poll', { notice: req.flash('pollNotice'), error: req.flash('pollError'), captcha_key: global.captcha.public_key, csrf: req.csrfToken() });
});

router.post('/poll', global.requireAuth, function(req, res){
  res.redirect('/poll');
});

module.exports = router;
