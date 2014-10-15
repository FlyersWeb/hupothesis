var express = require('express');
var router = express.Router();


/* GET Terms page. */
router.get('/terms', function(req, res){
  res.render('terms', { title: "Terms of use" });
});

module.exports = router;