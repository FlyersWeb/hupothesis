var config = require('../config');

var webdriverio = require('webdriverio');

var chai = require("chai");

var assert = chai.assert,  
    expect = chai.expect,
    should = chai.should();

var options = { desiredCapabilities: { browserName: 'phantomjs' }, logLevel: 'silent' };
var client = webdriverio.remote(options);

describe('upload',function(){
  this.timeout(99999999);
  before(function(done){
    client.init(done).url(config.url+'/upload');
  });
  it('should display login title',function(done){
    client
      .getText('h1',function(err,text){
        assert.equal(undefined,err);
        assert.strictEqual(text,'Login');
      })
      .call(done);
  });
  after(function(done){
    client.end(done);
  });
});