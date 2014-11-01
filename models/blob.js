var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var blobSchema = new Schema({
    tags: { type: [String ], default: [] },
    user: { type: Schema.Types.ObjectId, index: true },
    uptime: { type: String, default: null },
    expectedanstime: { type: String, default: null },
    deleted: { type: Date, default: null, index: true },
    added: { type: Date, default: Date.now() }
});

var Blob = mongoose.model('Blob', blobSchema);

module.exports = Blob;