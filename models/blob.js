var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var blobSchema = new Schema({
    user: { type: Schema.Types.ObjectId, index: true },
    tags: { type: [String], default: [] },
    title: { type: String },
    kind: { type: String },
    filename : { type: String, default: null },
    instruction : { type: String, default: null },
    uptime: { type: String, default: null },
    expectedanstime: { type: String, default: null },
    deleted: { type: Date, default: null, index: true },
    added: { type: Date, default: Date.now() }
});

var Blob = mongoose.model('Blob', blobSchema);

Blob.schema.path('kind').validate(function(value){
  return /file|poll/.test(value);
}, 'Invalid kind');

module.exports = Blob;