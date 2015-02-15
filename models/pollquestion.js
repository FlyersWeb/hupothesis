var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var pollQuestionSchema = new Schema({
    blob: { type: Schema.Types.ObjectId, index: true },
    poll: { type: Schema.Types.ObjectId, index: true },
    prompt: { type: String },
    type: { type: String },
    choices: { type: [String], default: null },
    points: { type: [String], default: null },
    deleted: { type: Date, default: null, index: true },
    added: { type: Date, default: Date.now() }
});

var PollQuestion = mongoose.model('PollQuestion', pollQuestionSchema);

PollQuestion.schema.path('type').validate(function (value) {
  return /multiple|unique|open/i.test(value);
}, 'Invalid question type');

module.exports = PollQuestion;