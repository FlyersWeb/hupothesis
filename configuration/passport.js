var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

var UserRole      = require('../models/userrole');

// used to serialize the user for the session
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

// used to deserialize the user
passport.deserializeUser(function(id, done) {
  UserRole.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, function(req, username, password, done){
  UserRole.findOne({'local.email':username,deleted:null}, function(err, user){
    if (err) return done(err);
    if(!user) return done(null, false, req.flash('loginError', 'No user found.'));
    user.validPassword(password,function(err,res){
      if(err) return done(err);
      if(!res) return done(null, false, req.flash('loginError', 'Oops! Wrong password.'));
    }); 
    return done(null, user);
  });
}));

module.exports = passport;