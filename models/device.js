var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var deviceSchema = new Schema({
    contestant: { type: [Schema.Types.ObjectId], index: true, default: null },
    appCodeName : { type: String, default: null },
    appName : { type: String, default: null },
    appVersion : { type: String, default: null },
    language : { type: String, default: null },
    platform : { type: String, default: null },
    product : { type: String, default: null },
    productSub : { type: String, default: null },
    vendor : { type: String, default: null },
    userAgent : { type: String, default: null },
    location : { type: String, default: null },
    referrer : { type: String, default: null },
    screenWidth : { type: String, default: null },
    screenHeight : { type: String, default: null },
    screenRatio : { type: String, default: null },
    deviceTime : { type: String, default: null },
    deviceTimeOffset : { type: String, default: null },
    remoteAddr : { type: String, default: null },
    deleted: { type: Date, default: null, index: true },
    lastMatched: { type: Date, default: Date.now() },
    added: { type: Date, default: Date.now() }
});

var Device = mongoose.model('Device', deviceSchema);

module.exports = Device;