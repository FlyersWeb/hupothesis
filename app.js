var express = require('express');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var methodOverride = require('method-override');
var csrf = require('csurf');

var path = require('path');
var fs = require('fs-extra');
var formidable = require('formidable');

var global = require('./configuration/global.js');

var mongoose = require('mongoose');
mongoose.connect(global.db.uri);

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(cookieParser());
app.use(session({ secret: "NK1zFuZp", resave:true, saveUninitialized:true}));
app.use(bodyParser())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(methodOverride());
app.use(csrf());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

function logErrors(err, req, res, next) {
  var url = req.protocol + '://' + req.get('host') + req.originalUrl;
  /* ------------- Email -------------- */
  var mailOptions = {
    from: global.email.user,
    to: global.email.user,
    subject: "[Hupothesis] Error Logger Type : "+err.status,
    text: "Getting URL : "+url+"\n\n"+err.message+"\n\n"+err.stack
  };
  global.email.transporter.sendMail(mailOptions, function(error, info){
      if(err){
        next(err);
      }else{
        console.log('Message sent: ' + info.response);
      }
  });
  /* ------------ */
  next(err);
}

function csrfErrorHandler(err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  res.status(403)
  res.render('error', { 
      message: err.message,
      error: err
  });
}

function captchaErrorHandler(err, req, res, next) {
  if (err.message == "incorrect-captcha-sol") {
    res.status(500);
    err.message = 'Invalid captcha'
    err.stack = 'You entered an invalid captcha, please try again'
    res.render('error', { 
        message: err.message,
        error: err
    });
  }
  next(err);
}

function errorHandler(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
}

function errorHandlerDev(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: err
  });
}

app.use(logErrors);
app.use(captchaErrorHandler);

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(errorHandlerDev);
}

// production error handler
// no stacktraces leaked to user
app.use(errorHandler);

module.exports = app;
