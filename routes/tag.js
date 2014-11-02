var express = require('express');
var router = express.Router();

var _ = require('underscore');

var global = require('../configuration/global.js');

var validator = require('validator');

var Blob = require('../models/blob.js');
var File = require('../models/file.js');

router.get('/tag/suggest/:sug', function(req,res,next){
  var sug = req.param('sug');
  sug = validator.toString(sug);

  var ret = [];
  var query = { tags : {$in:[new RegExp(sug, 'i')]}};

  Blob.find(query, 'tags', function(err,blobs){
    if(err){
      next(err);return;
    }

    for(var i=0; i<blobs.length; i++) {
      var blob = blobs[i];
      ret = ret.concat(blob.tags)
    }

    ret = _.uniq(ret);
    res.json(ret);
    
  });

});


module.exports = router;