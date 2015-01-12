var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var pollAnswerSchema = new Schema({
    poll: { type: Schema.Types.ObjectId, index: true },
    question: { type: Schema.Types.ObjectId, index: true },
    contestant: { type: Schema.Types.ObjectId, index: true },
    value: { type: [String], default: [] },
    deleted: { type: Date, default: null, index: true },
    viewed: { type: Date, default: null },
    added: { type: Date, default: null }
});

var PollAnswer = mongoose.model('PollAnswer', pollAnswerSchema);

module.exports = PollAnswer;