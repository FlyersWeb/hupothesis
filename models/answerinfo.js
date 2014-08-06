var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var answerInfoSchema = new Schema({
    userid : { type: Schema.Types.ObjectId, index: true },
    fileid : { type: Schema.Types.ObjectId, index : true },
    filename : { type: String, default: null },
    comments : { type: String, default: null },
    downloaded: { type: Date, default: null },
    added : { type: Date, default: Date.now() },
    deleted : { type: Date, default : null, index: true }    
});

answerInfoSchema.methods.findAll = function(cb) {
    return this.model('AnswerInfo').find({deleted:null}, cb);
};

var AnswerInfo = mongoose.model('AnswerInfo', answerInfoSchema);

module.exports = AnswerInfo;