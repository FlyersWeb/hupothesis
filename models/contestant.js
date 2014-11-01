var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var contestantSchema = new Schema({
    user: { type: Schema.Types.ObjectId, default: null, index: true },
    email: { type: String, default: null, index: true },
    optin: { type: Boolean, default: false },
    deleted: { type: Date, default: null, index: true },
    added: { type: Date, default: Date.now() }
});

var Contestant = mongoose.model('Contestant', contestantSchema);

module.exports = Contestant;