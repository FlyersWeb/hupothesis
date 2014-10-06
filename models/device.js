var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var deviceSchema = new Schema({
    contestant: { type: Schema.Types.ObjectId, index: true },
    deviceId : { type: String, default: null },
    remoteAddr : { type: String, default: null },
    userAgent : { type: String, default: null },
    deviceCountry : { type: String, default: null },
    deviceBrand : { type: String, default: null },
    deviceDateTime : { type: String, default: null },
    deviceDateTimeOffset : { type: String, default: null },
    deviceOs : { type: String, default: null },
    screenWidth : { type: String, default: null },
    screenHeight : { type: String, default: null },
    screenRatio : { type: String, default: null },
    deleted: { type: Date, default: null, index: true },
    lastMatched: { type: Date, default: Date.now() },
    added: { type: Date, default: Date.now() }
});

var Device = mongoose.model('Device', deviceSchema);

module.exports = Device;