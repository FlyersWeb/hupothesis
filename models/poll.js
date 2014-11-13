var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var pollSchema = new Schema({
    blob: { type: Schema.Types.ObjectId, index: true },
    title: { type: String },
    deleted: { type: Date, default: null, index: true },
    added: { type: Date, default: Date.now() }
});

var Poll = mongoose.model('Poll', pollSchema);

module.exports = Poll;