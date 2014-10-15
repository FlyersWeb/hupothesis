var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var fileAnswerSchema = new Schema({
    file: { type: Schema.Types.ObjectId, index: true },
    contestant: { type: Schema.Types.ObjectId, index: true },
    filename: { type: String },
    comments: { type: String, default: ''},
    deleted: { type: Date, default: null, index: true },
    added: { type: Date, default: Date.now() }
});

var FileAnswer = mongoose.model('FileAnswer', fileAnswerSchema);

module.exports = FileAnswer;