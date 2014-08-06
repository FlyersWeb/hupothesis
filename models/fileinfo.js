var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var fileInfoSchema = new Schema({
    userid: { type: Schema.Types.ObjectId, index: true},
    filename: String,
    uptime: { type: String, default: null },
    anstime: String,
    deleted: { type: Date, default: null, index: true },
    added: { type: Date, default: Date.now() }
});

fileInfoSchema.methods.findAll = function(cb) {
    return this.model('FileInfo').find({deleted: null}, cb);
};
fileInfoSchema.methods.findById = function(cb, id) {
  return this.model('FileInfo').find({id:id,deleted:null}, cb);
};

var FileInfo = mongoose.model('FileInfo', fileInfoSchema);

module.exports = FileInfo;