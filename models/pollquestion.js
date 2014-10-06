var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var pollQuestionSchema = new Schema({
    poll: { type: Schema.Types.ObjectId, index: true },
    prompt: { type: String },
    type: { type: String },
    deleted: { type: Date, default: null, index: true },
    added: { type: Date, default: Date.now() }
});

var PollQuestion = mongoose.model('PollQuestion', pollQuestionSchema);

PollQuestion.schema.path('type').validate(function (value) {
  return /multipleChoice|singleChoice|singleLevel|multipleLevel|numbered|open/i.test(value);
}, 'Invalid question type');

module.exports = PollQuestion;