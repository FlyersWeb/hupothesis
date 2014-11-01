var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var fileSchema = new Schema({
    blob: { type: Schema.Types.ObjectId, index: true },
    filename: { type: String },
    deleted: { type: Date, default: null, index: true },
    added: { type: Date, default: Date.now() }
});

var File = mongoose.model('File', fileSchema);

module.exports = File;