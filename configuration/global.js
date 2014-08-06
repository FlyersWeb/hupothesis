var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');

var transporter = null;
	transporter = nodemailer.createTransport({
	    host: process.env.OPENSHIFT_SENDGRID_HOST || 'localhost',
	    port: process.env.OPENSHIFT_SENDGRID_PORT || 25,
	    secure: false,
	    ignoreTLS: true,
	    debug: true,
	    auth : {
	    	user: process.env.OPENSHIFT_SENDGRID_USER || '',
	    	pass: process.env.OPENSHIFT_SENDGRID_PASS || ''
	    }
	});


var global = {
	app : {
		regex : /(\d+)?d?(\d+)h(\d+)?m?/,
		url : "http://www.timeup.com"
	},
	db : {
		uri: process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://localhost/timeup'
	},
	email : {
		user : "contact@hupothesis.com",
		transporter: transporter
	}
};

module.exports = global;