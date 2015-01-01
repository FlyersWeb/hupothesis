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
  
  deviceInfo['contestant'] = req.param('cid');
  deviceInfo['contestant'] = new Array(validator.toString(deviceInfo['contestant']));
  
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

  var callback = function(deviceInfo){
    var device = new Device(deviceInfo);
    device.save(function(err){
      if(err){
        next(err);
        return;
      }
      res.jsonp({"status":"OK"});
      return;
    });
  };

  Device.findOne({'userAgent':deviceInfo['userAgent'],
                  'deviceTimeOffset':deviceInfo['deviceTimeOffset'],
                  'screenWidth':deviceInfo['screenWidth'],
                  'screenHeight':deviceInfo['screenHeight'],
                  'screenRatio':deviceInfo['screenRatio']},
  function(err,device){
    if(err){
      next(err);
      return;
    }
    
    Contestant.findById(deviceInfo['contestant'],function(err,contestant){
      if(err){
        delete deviceInfo['contestant'];
        if(!device) {
          callback(deviceInfo);
        }
        res.jsonp({"status":"OK"});
        return;
      }
      if(contestant && device){
        if(device.contestant.indexOf(contestant.id)<0) {
          device.contestant.push(contestant);
          device.save();
          res.jsonp({"status":"OK"});
          return;
        }
      } 
      if(!contestant) {
        delete deviceInfo['contestant'];
      }
      if(!device) {
        callback(deviceInfo);
      }
    });  
  });
});

module.exports = router;