var webdriverio = require('webdriverio');

var chai = require("chai");

var assert = chai.assert,  
    expect = chai.expect,
    should = chai.should();

var options = { desiredCapabilities: { browserName: 'firefox' }, logLevel: 'silent' };
var client = webdriverio.remote(options);

describe('faq',function(){
  this.timeout(99999999);
  before(function(done){
    return client.init(done);
  });
  it('should display faq title',function(done){
    client
      .url('http://localhost:3000/faq')
      .getText('h1',function(err,text){
        assert.equal(undefined,err);
        assert.strictEqual(text,'Frequently Asked Questions');
      })
      .call(done);
  });
  after(function(done){
    client.end(done);
  });
});
