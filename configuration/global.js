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
		host : "hupothesis.com",
		url : "http://www.hupothesis.com",
		fileExts : ['.pdf'],
		fileLimit : 2097152
	},
	db : {
		name: 'hupothesis',
		uri: process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://localhost/hupothesis'
	},
	email : {
		user : "contact@hupothesis.com",
		transporter: transporter
	},
	captcha : {
		private_key: process.env.OPENSHIFT_RECAPTCHA_PRIVATE_KEY || '6LeGQPUSAAAAAA9JjXnT6yqbEIFPRPj6jjdN-P3k',
		public_key: process.env.OPENSHIFT_RECAPTCHA_PUBLIC_KEY || '6LeGQPUSAAAAALTh6FWNUf96BnAWAkD2gswYbPJx',
	},
	requireAuth: function(req, res, next){
	  // check if the user is logged in
	  if(!req.isAuthenticated()){
	  	req.session.toRedirect = req.path
	    res.redirect('/login');
	    return;
	  }
	  next();
	}
};

module.exports = global;