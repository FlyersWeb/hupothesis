var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    email : { type: String, index: true},
    newsletter : { type: Boolean, default: true },
    added : { type: Date, default: Date.now() },
    updated : { type: Date, default: null },
    deleted : { type: Date, default: null }
});

userSchema.methods.findAll = function(cb) {
    return this.model('User').find({deleted:null}, cb);
};
userSchema.methods.findByEmail = function(cb, email) {
  return this.model('User').find({deleted:null,email:email}, cb);
};

var User = mongoose.model('User', userSchema);

module.exports = User;