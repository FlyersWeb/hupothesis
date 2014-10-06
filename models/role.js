var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var roleSchema = new Schema({
    privileges : { type: [String], default: [] },
    title: { type: String },
    deleted: { type: Date, default: null, index: true },
    added: { type: Date, default: Date.now() }
});

var Role = mongoose.model('Role', roleSchema);

module.exports = Role;