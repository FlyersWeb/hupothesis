var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var segmentationSchema = new Schema({
    sec: { type: [String], default: [] },
    sex: { type: [String], default: [] },
    age: { type: [String], default: [] },
    attitude: { type: [String], default: [] },
    positioning: { type: [String], default: [] },
    profession: { type: [String], default: [] },
    belief: { type: [String], default: [] },
    culture: { type: [String], default: [] },
    habits: { type: [String], default: [] },
    deleted: { type: Date, default: null, index: true },
    updated: { type: Date, default: Date.now() }
    added: { type: Date, default: Date.now() }
});

var Segmentation = mongoose.model('Segmentation', segmentationSchema);

Segmentation.schema.path('sec').validate(function (value) {
  return /UMC|MC|LMC|U/i.test(value);
}, 'Invalid socioeconomic class');

Segmentation.schema.path('sex').validate(function (value) {
  return /F|M|U/i.test(value);
}, 'Invalid sex type');

Segmentation.schema.path('age').validate(function (value) {
  return /12-|12-18|18-25|25-40|40+|U/i.test(value);
}, 'Invalid age class');

Segmentation.schema.path('attitude').validate(function (value) {
  return /P|N|U/i.test(value);
}, 'Invalid attitude class');

Segmentation.schema.path('positioning').validate(function (value) {
  return /E|M|U/i.test(value);
}, 'Invalid positioning class');

Segmentation.schema.path('profession').validate(function (value) {
  return /MANAGERS|PROFESSIONALS|TECHNICIANS|CLERICAL|SERVICE|CRAFT|OPERATORS|ELEMENTARY|ARMED|U/i.test(value);
}, 'Invalid profession class');

Segmentation.schema.path('belief').validate(function (value) {
  return /Atheist|Christian|Muslim|Buddhist|Hindu|U/i.test(value);
}, 'Invalid belief class');

module.exports = Segmentation;