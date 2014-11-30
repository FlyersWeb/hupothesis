var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var bcrypt = require('bcrypt');

var userSchema = new Schema({
    //// anonymous, webmaster, distributor
    roles: { type: [String], default: null },
    local: {
      email: { type: String, index: true },
      password: { type: String },
      salt: { type: String, default: null },
      confirmToken: { type: String }
    },
    facebook: {
      id: { type: String },
      email: { type: String, index: true },
      token: { type: String },
      name: { type: String }
    },
    twitter: {
      id: { type: String },
      email: { type: String, index: true },
      token: { type: String },
      displayName: { type: String },
      userName: { type: String },
    },
    google: {
      id: { type: String },
      email: { type: String, index: true },
      token: { type: String },
      name: { type: String },
    },
    active: { type: Boolean, default: false, index: true },
    newsletter: { type: Boolean, default: false },
    deleted: { type: Date, default: null, index: true },
    added: { type: Date, default: Date.now() },
    lastLogin: { type: Date, default: Date.now() }
});

// generate Hash based on clear pass and salt
userSchema.statics.generateHash = function(password, salt, cb) {
  if(!salt){
    bcrypt.genSalt(10,function(err,salt){
      bcrypt.hash(password, salt, function(err, hash){
        cb(err,hash,salt);
      });
    });
  } else {
    bcrypt.hash(password, salt, function(err, hash){
      cb(err,hash,salt);
    });
  }
};

// checking if password is valid
userSchema.methods.validPassword = function(password, cb) {
  bcrypt.compare(password, this.local.password, function(err, res){
    cb(err,res);
  });
};

var User = mongoose.model('User', userSchema);

module.exports = User;