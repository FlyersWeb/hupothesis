var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var socialSchema = new Schema({
    contestant: { type: Schema.Types.ObjectId, index: true },
    facebookId : { type: String, default: null },
    twitterId : { type: String, default: null },
    googleId : { type: String, default: null },
    deleted: { type: Date, default: null, index: true },
    updated: { type: Date, default: Date.now() },
    added: { type: Date, default: Date.now() }
});

var Social = mongoose.model('Social', socialSchema);

module.exports = Social;