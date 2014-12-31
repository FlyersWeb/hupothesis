var express = require('express');
var router = express.Router();


/* GET track info */
router.get('/track', function(req, res){
  // TODO store datas in segmentation
  res.jsonp({"status":"OK"})
});

module.exports = router;