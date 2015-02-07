var express = require('express');
var router = express.Router();

var validator = require('validator');

var global = require('../configuration/global.js');

var Device = require('../models/device.js');
var Contestant = require('../models/contestant.js');

/* GET track info */
// API UserAgent : http://www.useragentstring.com/pages/api.php
router.get('/track', function(req, res, next){
  var deviceInfo = {};
  
  var cid = req.param('cid');
  if(typeof cid !== 'undefined' && cid.length > 0) {
    deviceInfo['contestant'] = cid;
    deviceInfo['contestant'] = validator.toString(deviceInfo['contestant']);
  }
  
  deviceInfo['appCodeName'] = req.param('appCodeName');
  deviceInfo['appCodeName'] = validator.toString(deviceInfo['appCodeName']);
  
  deviceInfo['appName'] = req.param('appName');
  deviceInfo['appName'] = validator.toString(deviceInfo['appName']);
  
  deviceInfo['appVersion'] = req.param('appVersion');
  deviceInfo['appVersion'] = validator.toString(deviceInfo['appVersion']);
  
  deviceInfo['language'] = req.param('language');
  deviceInfo['language'] = validator.toString(deviceInfo['language']);
  
  deviceInfo['platform'] = req.param('platform');
  deviceInfo['platform'] = validator.toString(deviceInfo['platform']);
  
  deviceInfo['product'] = req.param('product');
  deviceInfo['product'] = validator.toString(deviceInfo['product']);
  
  deviceInfo['vendor'] = req.param('vendor');
  deviceInfo['vendor'] = validator.toString(deviceInfo['vendor']);
  
  deviceInfo['location'] = req.param('location');
  deviceInfo['location'] = validator.toString(deviceInfo['location']);
  
  deviceInfo['referrer'] = req.param('referrer');
  deviceInfo['referrer'] = validator.toString(deviceInfo['referrer']);

  deviceInfo['userAgent'] = req.param('userAgent');
  deviceInfo['userAgent'] = validator.toString(deviceInfo['userAgent']);
  
  deviceInfo['productSub'] = req.param('productSub');
  deviceInfo['productSub'] = validator.toString(deviceInfo['productSub']);
  
  deviceInfo['deviceTime'] = req.param('time');
  deviceInfo['deviceTime'] = validator.toString(deviceInfo['deviceTime']);
  
  deviceInfo['deviceTimeOffset'] = req.param('timeoffset');
  deviceInfo['deviceTimeOffset'] = validator.toString(deviceInfo['deviceTimeOffset']);
  
  var deviceScreen = req.param('screen');
  deviceScreen = validator.toString(deviceScreen);
  var screenInfos = deviceScreen.split('x');
  deviceInfo['screenWidth'] = screenInfos[0]; 
  deviceInfo['screenHeight'] = screenInfos[1]; 
  deviceInfo['screenRatio'] = screenInfos[2];

  deviceInfo['remoteAddr'] = req.ip;

  Contestant.findById(deviceInfo['contestant'],function(err,contestant){
    if(err){
      next(err);
      return;
    } 

    Device.findOne({'userAgent':deviceInfo['userAgent'],
      'deviceTimeOffset':deviceInfo['deviceTimeOffset'],
      'screenWidth':deviceInfo['screenWidth'],
      'screenHeight':deviceInfo['screenHeight'],
      'screenRatio':deviceInfo['screenRatio']}, function(err,device){
      if(err){
        next(err);return;
      }
      if(!device){
        var device = new Device(deviceInfo);
        device.save(function(err){
          if(err){
            next(err);
            return;
          }
        });
      }
      if(device && contestant){
        Device.update({'_id':device.id,'contestant':{$ne:contestant.id}},
          {$push: {'contestant': contestant.id}},
          {multi:true},
          function(){}
        );
      }
    });
    res.jsonp({"status":"OK"});
    return;
  });  
});

module.exports = router;