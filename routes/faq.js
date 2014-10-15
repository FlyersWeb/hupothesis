var express = require('express');
var router = express.Router();


/* GET FAQ page. */
router.get('/faq', function(req, res) {
  res.render('faq', { title: 'About us' });
});

module.exports = router;