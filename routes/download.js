var express = require('express');
var router = express.Router();

var validator = require('validator');

var fs = require('fs-extra');

var simple_recaptcha = require('simple-recaptcha');

var global = require('../configuration/global.js');

var User = require('../models/user.js');
var Blob = require('../models/blob.js');
var Answer = require('../models/fileanswer.js');

router.get('/getfile/:fileinfoid', function(req, res, next){

  var fileinfoid = req.param('fileinfoid');
  fileinfoid = validator.toString(fileinfoid);

    Blob.findOne({'_id':fileinfoid,'kind':'file','deleted':null}, function(err,blob){
      if ( !blob ) {
        req.flash('answerError', "Oops, invalid file identifier");
        res.redirect('/upload/answer/'+fileinfoid);
        return;
      }

      var filePath = './tmp/'+blob.id;
      var stat = fs.statSync(filePath);

      var rdStream = fs.createReadStream(filePath);

      res.writeHead(200, {
        'Content-Length': stat.size
      });

      rdStream.pipe(res);
    });
});

router.get('/file/getanswer/:answerid', function(req, res, next){
  var userid = req.session.passport.user;

  var answerid = req.param('answerid');
  answerid = validator.toString(answerid);

  Answer.findById(answerid,function(err,answer){
    if(err){
      next(err);
      return;
    }

    var filePath = './tmp/'+answer.id;
    if(!fs.existsSync(filePath)) {
      req.flash('profileError','Oops! Answer not available');
      res.redirect('/profile/'+userid);
      return;
    }
    
    var stat = fs.statSync(filePath);

    var rdStream = fs.createReadStream(filePath);

    res.writeHead(200, {
      'Content-Length': stat.size
    });

    rdStream.pipe(res);
    return;
  });
});

module.exports = router;
