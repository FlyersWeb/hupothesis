var express = require('express');
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');

var app = express();

var transporter = null;
if (app.get('env') === 'development') {
	transporter = nodemailer.createTransport({
	    host: 'localhost',
	    port: 25,
	    secure: false,
	    ignoreTLS: false,
	    maxConnections: 5,
	    maxMessages: 0,
	    debug: true
	});
} else {
	transporter = nodemailer.createTransport(sgTransport({
	    auth: {
	    	api_user: process.env.OPENSHIFT_SENDGRID_USER || '',
	    	api_key: process.env.OPENSHIFT_SENDGRID_PASS || ''
	    }
	}));
}


var global = {
	app : {
		regex : /(\d+)?d?(\d+)h(\d+)?m?/,
		url : "http://www.timeup.com"
	},
	db : {
		// host: "",
		// user: "",
		// pass: "",
		// dbname: "",
		uri: process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://localhost/timeup'
	},
	email : {
		user : "contact@hupothesis.com",
		transporter: transporter
	}
};

module.exports = global;