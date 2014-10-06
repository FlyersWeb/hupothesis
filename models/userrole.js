var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userRoleSchema = new Schema({
    roles: { type: [Schema.Types.ObjectId], default: null },
    email: { type: String, index: true },
    password: { type: String },
    salt: { type: String },
    confirmToken: { type: String },
    optin: { type: Boolean, default: false },
    deleted: { type: Date, default: null, index: true },
    added: { type: Date, default: Date.now() }
    lastLogin: { type: Date, default: Date.now() }
});

var UserRole = mongoose.model('UserRole', userRoleSchema);

module.exports = UserRole;