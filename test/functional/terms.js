var webdriverio = require('webdriverio');

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
var assert = chai.assert,  
    expect = chai.expect,
    should = chai.should();

var options = { desiredCapabilities: { browserName: 'firefox' }, logLevel: 'silent' };
var client = webdriverio.remote(options);

describe('terms',function(){
  this.timeout(99999999);
  before(function(done){
    return client.init(done);
  });
  it('should display terms title',function(done){
    client
      .url('http://localhost:3000/terms')
      .getText('h1',function(err,text){
        assert.equal(undefined,err);
        assert.strictEqual(text,'Terms of use');
      })
      .call(done);
  });
  after(function(done){
    client.end(done);
  });
});
