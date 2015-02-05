var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var launchSchema = new Schema({
    email: { type: String, default: null, index: true },
    optin: { type: Boolean, default: false },
    deleted: { type: Date, default: null, index: true },
    added: { type: Date, default: Date.now() }
});

var Launch = mongoose.model('Launch', launchSchema);

module.exports = Launch;