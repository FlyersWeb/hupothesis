var express = require('express');
var router = express.Router();

var nodemailer = require('nodemailer');

var validator = require('validator');

var formidable = require('formidable');
var fs = require('fs-extra');

var mongoose = require('mongoose');

var global = require('../configuration/global.js');

var User = require('../models/user.js');
var FileInfo = require('../models/fileinfo.js');
var AnswerInfo = require('../models/answerinfo.js');

validator.extend('isTimeUp', function(str){
  return /(\d+)?d?(\d+)h(\d+)?m?/.test(str);
});


/* GET home page. */
// router.get('/', function(req, res) {
//   res.render('index', { title: 'Hupothesis - validate your hypothesis', notice: null });
// });

/* GET FAQ page. */
router.get('/faq', function(req, res) {
  res.render('faq', { title: 'Hupothesis - FAQ', notice: null });
});

/* GET contact page. */
router.get('/contact', function(req, res) {
  res.render('contact', { title: 'Hupothesis - contact us', notice: null });
});

/* GET launch page. */
router.get('/', function(req, res) {
  res.render('launch', { title: 'Hupothesis - launch soon', notice: null });
});

router.get('/terms', function(req, res){
  res.render('terms', { title: "Terms of use"});
});

// Post launch newsletter
router.post('/launch', function(req, res) {

  var email = req.body.email;

  if ( !validator.isEmail(email) ) {
    res.render('launch', {title: 'Hupothesis - error', error: 'Invalid email'});
  }

  User.findOne({'email':email, deleted:null}, 'id email deleted updated added', function(err, user){
    if (err) {
      throw err;
    }

    if ( !user ) {
      user = new User({email: email});
      user.save(function(err){
        if(err)
          throw err;
      });
    }

    /* ------------- Email -------------- */
    var mailOptions = {
      from: global.email.user,
      to: ''+email+', '+global.email.user+'',
      subject: "[Hupothesis] Newsletter subscription",
      text: "Congratulations, we've received your request to be informed when Hupothesis will be online. We're working hard to let you access our service as soon as possible.\nFeel free to contact us when you need.\nThanks."
    };

    global.email.transporter.sendMail(mailOptions, function(error, info){
        if(error){
            throw(error);
        }else{
            console.log('Message sent: ' + info.response);
        }
    });
    /* ------------ */

    res.render('launch', { title: 'Hupothesis - launch soon', notice: 'Your request has been taken in account' });

  });

});

router.post('/contact', function(req, res) {

  var email = req.body.email;
  var subject = req.body.subject;
  var comments = req.body.comments;

  if ( !validator.isEmail(email) ) {
    res.render('launch', {title: 'Hupothesis - error', error: 'Invalid email'});
  }

  subject = validator.toString(subject);
  comments = validator.toString(comments);

  User.findOne({'email':email, deleted:null}, 'id email deleted updated added', function(err, user){
    if (err) {
      throw err;
    }

    if ( !user ) {
      user = new User({email: email});
      user.save(function(err){
        if(err)
          throw err;
      });
    }

    /* ------------- Email -------------- */
    var mailOptions = {
      from: global.email.user,
      to: ''+email+', '+global.email.user+'',
      subject: "[Hupothesis] Message successfully sent",
      text: "Congratulations, we've received your contact request we'll respond as soon as possible.\nThanks."
    };

    global.email.transporter.sendMail(mailOptions, function(error, info){
        if(error){
            throw(error);
        }else{
            console.log('Message sent: ' + info.response);
        }
    });


    var mailOptions = {
      from: email,
      to: ''+global.email.user+'',
      subject: "[Hupothesis] "+subject,
      text: comments
    };

    global.email.transporter.sendMail(mailOptions, function(error, info){
        if(error){
            throw(error);
        }else{
            console.log('Message sent: ' + info.response);
        }
    });
    /* ------------ */

    res.render('contact', { title: 'Hupothesis - contact us', notice: "Message sent with success" });

  });
});

// Upload test
router.post('/upload', function(req, res) {

  var form = new formidable.IncomingForm();
  form.uploadDir = "./tmp";
  form.keepExtensions = false;

  form.parse(req, function(err, fields, files){
    if (err)
      throw err;

    if ( !validator.isEmail(fields.email) ) {
      res.render('index', { title: 'Hupothesis', upload: false, error: "Invalid Email" });
      return;
    }

    if ( !validator.isTimeUp(fields.timeup) ) {
      res.render('index', { title: 'Hupothesis', upload: false, error: "Invalid Answer Time" });
      return;
    }

    User.findOne({'email':fields.email, deleted:null}, 'id email deleted updated added', function(err, user){
      if (err) {
        throw err;
      }

      if ( !user ) {
        user = new User({email:fields.email});
        user.save(function(err){
          if(err)
            throw err;
        });
      }

      var fileInfo = new FileInfo({userid:user.id,filename:files.fileinfo.name,anstime:fields.timeup});
      fileInfo.save(function(err){
        if(err)
          throw err;
      });

      fs.rename(files.fileinfo.path, './tmp/'+fileInfo.id, function(err){
        if (err)
          throw err;
      });

      /*  --- Email Notification ---  */
      var mailOptions = {
        from: global.email.user,
        to: ''+fields.email+', '+global.email.user+'',
        subject: "[Hupothesis] File uploaded with success",
        text: "Congratulations, you've successfully uploaded "+files.fileinfo.name+". You can share it using "+global.app.url+"/answer/"+fileInfo.id+"."
      };

      global.email.transporter.sendMail(mailOptions, function(error, info){
          if(error){
              throw(error);
          }else{
              console.log('Message sent: ' + info.response);
          }
      });
      /* ------------ */

      res.render('index', { title: 'Hupothesis', upload: true, fileid: fileInfo.id });
      return;
    });
  });

});

// Set session
router.get('/answer/:fileinfoid', function(req, res) {

  var fileinfoid = req.param('fileinfoid');

  FileInfo.findOne({'_id': fileinfoid, 'deleted':null}, 'filename uptime anstime', function(err, fileInfo){
    if (err)
      throw err;

    if ( !fileInfo ) {
      res.redirect('/');
      return;
    }

    res.render('answer', { title: 'Hupothesis', fileinfo: { id: fileInfo.id, anstime: fileInfo.anstime }});

  });
});

// Upload answers
router.post('/answer', function(req, res) {

  var form = new formidable.IncomingForm();
  form.uploadDir = "./tmp";
  form.keepExtensions = false;

  form.parse(req, function(err,fields,files){

    if ( !validator.isEmail(fields.email) ) {
      res.render('answer', { title: 'Hupothesis', upload: false, error: "Invalid Email" });
    }

    User.findOne({'email':fields.email,'deleted':null},'id email',function(err,user){
      if(err)
        throw err;

      if ( !user ) {
        var user = new User({email:fields.email});
        user.save(function(err){
          if(err)
            throw err;
        });
      }

      FileInfo.findOne({'_id':fields.fileinfo,'deleted':null}, 'id userid', function(err,fileInfo){
        if(err)
          throw err;

        if ( !fileInfo ) {
          res.redirect('/');
          return;
        }

        fs.rename(files.answerinfo.path, './tmp/'+files.answerinfo.filename, function(err){
          if (err)
            throw err;
        });

        AnswerInfo.findOne({'fileid':fileInfo.id,'userid':user.id,'deleted':null}, 'id', function(err, answerInfo){
          if(err)
            throw err;

          if(!answerInfo) {
            answerInfo = new AnswerInfo({'fileid':fileInfo.id,'userid':user.id,'downloaded':Date.now(),'filename':files.answerinfo.name,'comments':fields.comments});
            answerInfo.save(function(err){
              if(err)
                throw err;
            });
          }

          AnswerInfo.update({'fileid':fileInfo.id,'userid':user.id}, {'filename':files.answerinfo.name,'comments':fields.comments}, {}, function(err){
            if(err)
              throw err;
          });

          /*  --- Email Notification ---  */
          
          var mailOptions = {
            from: global.email.user,
            to: ''+user.email+', '+global.email.user+'',
            subject: "[Hupothesis] Answers uploaded with success",
            text: "Congratulations, you've successfully uploaded "+files.answerinfo.name+". Your administrator will be notified."
          };

          global.email.transporter.sendMail(mailOptions, function(error, info){
              if(error){
                  throw(error);
              }else{
                  console.log('Message sent: ' + info.response);
              }
          });

          User.findOne({'_id':fileInfo.userid,'deleted':null}, 'id email', function(err,fileUser){
            if ( err )
              throw err;

            if ( fileUser )
            {
              var mailOptions = {
                from: global.email.user,
                to: ''+fileUser.email+', '+global.email.user+'',
                subject: "[Hupothesis] Answers uploaded",
                text: "You've received answers for your file "+fileInfo.filename+". You can view your files status on "+global.app.url+"/profile/"+fileUser.id+"."
              };

              global.email.transporter.sendMail(mailOptions, function(error, info){
                  if(error){
                      throw(error);
                  }else{
                      console.log('Message sent: ' + info.response);
                  }
              });
            }
          });

          /* ------------ */
     
          res.render('answer', { title: 'Hupothesis', fileinfo: { id: fileInfo.id, anstime: fileInfo.anstime }, upload: true});

        });
      });
    });
  });

});

router.get('/download/:fileinfoid', function(req, res){

  var fileinfoid = req.param('fileinfoid');

  FileInfo.findOne({'_id':fileinfoid,'deleted':null}, 'id userid uptime anstime filename downloaded', function(err,fileInfo){
    if (err)
      throw err;

    if( !fileInfo ) {
      res.redirect('/answer/'+fileinfoid);
      return;
    }

    res.render('download', {title: 'Hupothesis', fileinfo: {id: fileInfo.id}});

  });    

});

router.post('/download', function(req, res){

  var fileinfoid = req.body.fileinfoid;
  var email = req.body.email;

  if ( !validator.isEmail(email) ) {
    res.redirect('/answer/'+fileinfoid);
  }

  User.findOne({'email':email,'deleted':null}, 'id email', function(err, user){
    if (err)
      throw err;

    if( !user ) {
      user = new User({'email': email});
      user.save(function(err){
        if(err)
          throw err;
      });
    }

    FileInfo.findOne({'_id':fileinfoid,'deleted':null}, 'id userid uptime anstime filename downloaded', function(err,fileInfo){

      if ( !fileInfo ) {
        res.redirect('/answer/'+fileinfoid);
        return;
      }

      AnswerInfo.update({'fileid':fileInfo.id,'userid':user.id}, { 'downloaded': new Date() }, {'upsert':true}, function(err){
        if(err)
          throw err;
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

      global.email.transporter.sendMail(mailOptions, function(error, info){
          if(error){
              throw(error);
          }else{
              console.log('Message sent: ' + info.response);
          }
      });

      /*  --- --- ---  */

    });
  });
});

module.exports = router;
