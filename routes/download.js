var express = require('express');
var router = express.Router();

var validator = require('validator');

var fs = require('fs-extra');

var simple_recaptcha = require('simple-recaptcha');

var global = require('../configuration/global.js');

var User = require('../models/user.js');
var Blob = require('../models/blob.js');
var File = require('../models/file.js');
var Answer = require('../models/fileanswer.js');
var Contestant = require('../models/contestant.js');


router.get('/getfile/:fileinfoid', function(req, res, next){

  var fileinfoid = req.param('fileinfoid');
  fileinfoid = validator.toString(fileinfoid);

  var callback = function(contestant) {

    if(!contestant){
      req.flash("answerError","Oops! Invalid temporary user creation");
      res.redirect('/upload/answer/'+fileinfoid);
      return;
    }

    File.findOne({'_id':fileinfoid,'deleted':null}, function(err,file){
      if ( !file ) {
        req.flash('answerError', "Oops, invalid file identifier");
        res.redirect('/upload/answer/'+fileinfoid);
        return;
      }

      Answer.update({'file':file.id,'contestant':contestant._id}, { 'downloaded': new Date() }, {'upsert':true}, function(err){
        if(err) {
          next(err);
          return;
        }
      });

      var filePath = './tmp/'+file.id;
      var stat = fs.statSync(filePath);

      var rdStream = fs.createReadStream(filePath);

      res.writeHead(200, {
        'Content-Length': stat.size
      });

      rdStream.pipe(res);

      /*  --- Email Notification ---  */   
      var mailOptions = {
        from: global.email.user,
        to: ''+global.email.user+'',
        subject: "[Hupothesis] Exam downloaded with success",
        text: "File "+file.filename+" downloaded with success. Downloaded by "+contestant.email+"."
      };

      global.email.transporter.sendMail(mailOptions, function(err, info){
          if(err){
            next(err);
            return;
          }else{
            console.log('Message sent: ' + info.response);
          }
      });
      /*  --- --- ---  */
    });
  };

  if (!req.session.contestant)
  {
    var contestant = new Contestant({});
    contestant.save(function(err){
      if(err) {
        next(err);
        return;
      }
      req.session.contestant = contestant;
      callback(contestant);
    });
  }
  else
  {
    var contestant = req.session.contestant;
    callback(contestant);
  }
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
