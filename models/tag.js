var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tagSchema = new Schema({
    segmentations: { type: [Schema.Types.ObjectId], default: null },
    parent: { type: Schema.Types.ObjectId, default: null, index: true },
    name: { type: String },
    description: { type: String, default: '' },
    deleted: { type: Date, default: null, index: true },
    added: { type: Date, default: Date.now() }
});

var Tag = mongoose.model('Tag', tagSchema);

module.exports = Tag;