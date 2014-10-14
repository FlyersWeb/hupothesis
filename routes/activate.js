var express = require("express");
var router = express.Router();

var validator = require('validator');

var global = require('../configuration/global.js');

var UserRole = require('../models/userrole');


router.get('/activate/:token', function(req,res,next){
  var token = req.params.token;
  token = validator.toString(token);

  UserRole.findOne({'local.confirmToken':token,'deleted':null}, function(err,user){
    if(err) next(err);
    if(user) {
      user.active = true;
      user.local.confirmToken = null;
      user.save(function(err){
        if(err) next(err);
      })

      /* ------------- Email -------------- */
      var mailOptions = {
        from: global.email.user,
        to: ''+user.local.email+', '+global.email.user+'',
        subject: "[Hupothesis] Account activated",
        text: "Congratulations, You've successfully activated your account.\nYou can now validate your hypothesis by logging in on "+global.app.url+"/login\nFeel free to contact us for any doubt at "+global.app.url+"/contact"
      };

      global.email.transporter.sendMail(mailOptions, function(error, info){
          if(err){
            next(err);
          }else{
            console.log('Message sent: ' + info.response);
          }
      });
      /* ------------ */

      req.flash('activateNotice', 'User activated with success ! You can now login to use our services');
    } else {
      req.flash('activateError', 'Oops, no user found for this token. Please try to register again.');
    }
    res.render('activate', { notice: req.flash('activateNotice'), error: req.flash('activateError')});
  });
});

module.exports = router;