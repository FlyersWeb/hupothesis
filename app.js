var express = require('express');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var flash = require('connect-flash');
var methodOverride = require('method-override');
var csrf = require('csurf');

var exphbs = require('express-handlebars');
var hbs = exphbs.create({
  defaultLayout: 'main', 
  extname: '.html',
  helpers: {
    ifCond: function (v1, v2, options) { 
      if(v1 === v2) {
        return options.fn(this);
      }
      return options.inverse(this);
    },
    inc: function(options) {
      return (this.id+1);
    },
    dec: function(options) {
      return (this.id-1);
    },
    prettify: function(timestamp) {
      var ret = '';
      var years = 0;
      var months = 0;
      var days = 0;
      var hours = 0;
      var minutes = 0;
      var seconds = Math.floor(timestamp / 1000);

      var interval = Math.floor(seconds / 31536000);
      if (interval > 1) {
        years = interval;
      }
      interval = Math.floor(seconds / 2592000);
      if (interval > 1) {
        months = interval;
      }
      interval = Math.floor(seconds / 86400);
      if (interval > 1) {
        days = interval;
      }
      interval = Math.floor(seconds / 3600);
      if (interval > 1) {
        hours = interval;
      }
      interval = Math.floor(seconds / 60);
      if (interval > 1) {
        minutes = interval;
      }
      seconds = Math.floor(seconds);

      if(hours) {
        ret += hours+' hours ';
      }
      if(minutes) {
        ret += minutes+' minutes ';
      }
      if(seconds) {
        ret += seconds+'';
      }
      if(ret.length == 0) {
        ret = 'Unknown';
      }
      return ret;
    }
  }
})

var path = require('path');
var fs = require('fs-extra');
var formidable = require('formidable');

var global = require('./configuration/global.js');

var passport = require('passport');
passport = require('./configuration/passport');

var mongoose = require('mongoose');
mongoose.connect(global.db.uri);

var MongoStore = require('connect-mongo')(session);

var app = express();

// view engine setup
app.engine('.html', hbs.engine);
// app.set('views', path.join(__dirname, 'views'));
app.set('view engine', '.html');

app.use(favicon());
app.use(logger('dev'));
app.use(cookieParser());
app.use(session({ 
    secret: "NK1zFuZp", 
    resave:true, 
    saveUninitialized:true,
    store: new MongoStore({
      db: global.db.name,
      url : global.db.uri,
      auto_reconnect: true
    })
  }));
app.use(bodyParser())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride());
app.use(csrf());
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));


app.use(function(req, res, next) {
  res.locals.session = req.session;
  res.locals.authenticated = req.isAuthenticated();
  next();
});


//// routes

var index = require('./routes/index');
var uploadanswer = require('./routes/uploadanswer');
var upload = require('./routes/upload');
var poll = require('./routes/poll');
var pollanswer = require('./routes/pollanswer');
var download = require('./routes/download');
var logins = require('./routes/logins');
var registers = require('./routes/registers');
var activate = require('./routes/activate');
var launch = require('./routes/launch');
var faq = require('./routes/faq');
var term = require('./routes/term');
var contact = require('./routes/contact');
var users  = require('./routes/users');
var profile  = require('./routes/profile');
var tags  = require('./routes/tag');
var track  = require('./routes/track');

var widgets = require('./routes/widget');

app.use('/', index);
app.use('/', upload);
app.use('/', poll);
app.use('/', pollanswer);
app.use('/', uploadanswer);
app.use('/', download);
app.use('/', registers);
app.use('/', launch);
app.use('/', activate);
app.use('/', faq);
app.use('/', term);
app.use('/', contact);
app.use('/', logins);
app.use('/', tags);
app.use('/', profile);
app.use('/', track);
app.use('/', widgets);

app.use('/users', users);


/// middlewares

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

/// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//     var err = new Error('Not Found');
//     err.status = 404;
//     next(err);
// });

module.exports = app;
