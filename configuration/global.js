var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');

var transporterOptions = {
	    host: process.env.OPENSHIFT_SENDGRID_HOST || 'localhost',
	    port: process.env.OPENSHIFT_SENDGRID_PORT || 25,
	    secure: false,
	    ignoreTLS: true,
	    debug: true,
	};

if ( process.env.OPENSHIFT_SENDGRID_USER && process.env.OPENSHIFT_SENDGRID_PASS ) {
	transporterOptions.auth = {
	    	user: process.env.OPENSHIFT_SENDGRID_USER || '',
	    	pass: process.env.OPENSHIFT_SENDGRID_PASS || ''
	    };
}

var transporter = null;
	transporter = nodemailer.createTransport(transporterOptions);


var global = {
	app : {
		regex : /(\d+)?d?(\d+)h(\d+)?m?/,
		url : "http://www.hupothesis.com"
	},
	db : {
		uri: process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://localhost/timeup'
	},
	email : {
		user : "contact@hupothesis.com",
		transporter: transporter
	},
	captcha : {
		private_key: process.env.OPENSHIFT_RECAPTCHA_PRIVATE_KEY || '',
		public_key: process.env.OPENSHIFT_RECAPTCHA_PUBLIC_KEY || '',
	}
};

module.exports = global;