var express = require('express');
var router = express.Router();

var validator = require('validator');

var simple_recaptcha = require('simple-recaptcha');

var global = require('../configuration/global.js');

var User = require('../models/user.js');
var FileInfo = require('../models/fileinfo.js');
var AnswerInfo = require('../models/answerinfo.js');

router.get('/download/:fileinfoid', function(req, res, next){

  var fileinfoid = req.param('fileinfoid');

  FileInfo.findOne({'_id':fileinfoid,'deleted':null}, 'id userid uptime anstime filename downloaded', function(err,fileInfo){
    if (err)
      next(err);

    if( !fileInfo ) {
      res.redirect('/answer/'+fileinfoid);
      return;
    }

    var fileinfo = {id: fileInfo.id};

    res.render('download', {title: 'Hupothesis', error: req.flash('downloadError'), notice: req.flash('downloadNotice'), fileinfo: fileinfo, captcha_key: global.captcha.public_key, csrf:req.csrfToken() });

  });    

});

router.post('/download', function(req, res, next){

  var fileinfoid = req.body.fileinfoid;
  var email = req.body.email;

  var ip = req.ip;
  var challenge = req.body.recaptcha_challenge_field;
  var response = req.body.recaptcha_response_field;
  var private_key = global.captcha.private_key;

  if ( !validator.isEmail(email) ) {
    res.redirect('/answer/'+fileinfoid);
    return;
  }

  simple_recaptcha(private_key, ip, challenge, response, function(err) {  

    if (err) next(err);

    User.findOne({'email':email,'deleted':null}, 'id email', function(err, user){
      if (err)
        next(err);

      if( !user ) {
        user = new User({'email': email});
        user.save(function(err){
          if(err)
            next(err);
        });
      }

      FileInfo.findOne({'_id':fileinfoid,'deleted':null}, 'id userid uptime anstime filename downloaded', function(err,fileInfo){

        if ( !fileInfo ) {
          res.redirect('/answer/'+fileinfoid);
          return;
        }

        AnswerInfo.update({'fileid':fileInfo.id,'userid':user.id}, { 'downloaded': new Date() }, {'upsert':true}, function(err){
          if(err)
            next(err);
        });

        var filePath = './tmp/'+fileinfoid;
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
          text: "File "+fileInfo.filename+" downloaded with success. Downloaded by "+user.email+"."
        };

        global.email.transporter.sendMail(mailOptions, function(err, info){
            if(err){
              next(err);
            }else{
              console.log('Message sent: ' + info.response);
            }
        });

        /*  --- --- ---  */
      });
    });
  });
});

module.exports = router;
