var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var pollAnswerSchema = new Schema({
    poll: { type: Schema.Types.ObjectId, index: true },
    question: { type: Schema.Types.ObjectId, index: true },
    contestant: { type: Schema.Types.ObjectId, index: true },
    value: { type: [String] },
    deleted: { type: Date, default: null, index: true },
    added: { type: Date, default: Date.now() }
});

var PollAnswer = mongoose.model('PollAnswer', pollAnswerSchema);

module.exports = PollAnswer;