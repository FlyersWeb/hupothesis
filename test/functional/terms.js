var config = require('../config');

var webdriverio = require('webdriverio');

var chai = require("chai");

var assert = chai.assert,  
    expect = chai.expect,
    should = chai.should();

var options = { desiredCapabilities: { browserName: 'phantomjs' }, logLevel: 'silent' };
var client = webdriverio.remote(options);

describe('terms',function(){
  this.timeout(99999999);
  before(function(done){
    client.init(done).url(config.url+'/terms');
  });
  it('should display terms title',function(done){
    client
      .getText('h1',function(err,text){
        assert.strictEqual(text,'Terms of use');
      })
      .call(done);
  });
  after(function(done){
    client.end(done);
  });
});
