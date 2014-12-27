var express = require("express");
var router = express.Router();

var validator = require('validator');
var passport = require("passport");

var simple_recaptcha = require('simple-recaptcha');

var global = require('../configuration/global.js');

var User = require('../models/user');

var crypto = require('crypto');

router.get('/register', function(req, res, next){
  res.render('register', { csrf: req.csrfToken(), captcha_key: global.captcha.public_key, error: req.flash('registerError'), notice: req.flash('registerNotice') } );
});

router.post('/register', function(req, res, next){
  var email = req.body.email
  var password = req.body.password;
  var confirm = req.body.confirm;

  password  = validator.toString(password);
  confirm   = validator.toString(confirm);

  if ( !validator.isEmail(email) ) {
    req.flash('registerError', 'Invalid email address');
    next();
  }

  if (password != confirm) {
    req.flash('registerError', 'Invalid password confirmation');
    next();
  }  


  User.findOne({'local.email':email,deleted:null},function(err,user){
    if(err) next(err);
    if(!user){
      User.generateHash(password, null, function(err,hash,salt){
        if (err) next(err);
        crypto.randomBytes(18, function(err,buf){
          if(err) next(err);
          var token = buf.toString('hex');

          var newUser = new User({'roles':['anonymous'],'local.email':email,'local.password':hash,'local.salt':salt,'local.confirmToken':token});
          newUser.save(function(err){
            if(err) next(err);

            /* ------------- Email -------------- */
            var mailOptions = {
              from: global.email.user,
              to: ''+email+', '+global.email.user+'',
              subject: "[Hupothesis] Account activation",
              text: "Congratulations, we've received your request to create an account on hupothesis.\nPlease activate your account to unleash the power of hupothesis by getting on "+global.app.url+"/activate/"+token+"\nFeel free to contact us for any doubt at "+global.app.url+"/contact"
            };

            global.email.transporter.sendMail(mailOptions, function(error, info){
                if(err){
                  next(err);
                }else{
                  console.log('Message sent: ' + info.response);
                }
            });
            /* ------------ */

            req.flash('registerNotice', 'Account registered with success');
            res.redirect('/register');
            
          });
        });
      });
    } else {
      req.flash('registerError','Email already in use.');
      res.redirect('/register');
    }
  });

});

router.post('/reset', global.requireAuth, function(req, res, next){
  var userid = req.session.passport.user;

  var password = req.body.password1;
  var newPassword = req.body.password2;
  var confPassword = req.body.password3;

  if(newPassword != confPassword) {
    req.flash('profileError', 'Oops! Invalid password confirmation');
    res.redirect('/profile/'+userid);
    return;
  }

  User.findById(userid,function(err,user){
    if(err){
      next(err);
      return;
    }

    User.generateHash(password,user.local.salt,function(err,hash,salt){
      if(err){
        next(err);
        return;
      }
      if(hash != user.local.password) {
        req.flash('profileError', 'Oops! Invalid password');
        res.redirect('/profile/'+userid);
        return;
      }
      User.generateHash(newPassword,null,function(err,hash,salt){
        User.update({'_id':user.id},{'local.password':hash,'local.salt':salt},function(err,user){
          if(err){
            next(err);
            return;
          }
          req.flash('profileNotice','Password updated successfully');
          res.redirect('/profile/'+userid);
          return;
        });
      });
    });
  });
});

module.exports = router;