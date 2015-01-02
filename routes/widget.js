var express = require("express");
var router = express.Router();

var validator = require('validator');

var global = require('../configuration/global.js');

var Blob = require('../models/blob');
var File = require('../models/file');
var Poll = require('../models/poll');

router.get('/1.0/widget', function(req,res,next){
  res.type('text/javascript');

  var blobid = req.query.b;
  blobid = validator.toString(blobid);

  if(blobid.length <= 0) {
    res.status(400).send('<alert>Uknown exam or poll</alert>');
    return;
  }

  var callback = function(blobid) {
    Poll.findOne({'_id':blobid,'deleted':null}, function(err,poll){
      if(err){
        next(err);
        return;
      }
      if (poll) {
        res.render('widget', {'layout':false, 'grip': 'Answer our poll at', 'suffix':'/poll/answer/', 'blobid':poll._id});
        return;
      }

      res.status(400).send('<alert>Uknown exam or poll</alert>');
      return;
    });
  }

  File.findOne({'_id':blobid,'deleted':null}, function(err,file){
    if(err){
      next(err);
      return;
    }
    if (file) {
      res.render('widget', {'layout':false, 'grip': 'File available at', 'suffix':'/upload/answer/', 'blobid':file._id});
      return;
    }

    callback(blobid);
  });

  
});

module.exports = router;