var config = require('../config');

var webdriverio = require('webdriverio');

var chai = require("chai");

var assert = chai.assert,  
    expect = chai.expect,
    should = chai.should();

var options = { desiredCapabilities: { browserName: 'phantomjs' }, logLevel: 'silent' };
var client = webdriverio.remote(options);

describe('index',function(){
  this.timeout(99999999);
  before(function(done){
    client.init(done).url(config.url+'/home');
  });
  it('should display index title',function(done){
    client
      .getText('h1',function(err,text){
        assert.equal(undefined,err);
        assert.strictEqual(text,'Validate your hypothesis');
      })
      .call(done);
  });
  it('should contain links to poll creation', function(done){
    client
      .getAttribute('a.link', 'href', function(err,res){
        assert.lengthOf(res, 2, 'we should have 2 creation processes');
        assert.match(res[0], /\/poll/, 'one should point to /poll');
        assert.match(res[1], /\/upload/, 'one should point to /upload');
      })
      .call(done)
  });
  it('should contain link to faq', function(done){
    client
      .getAttribute('a[href="/faq"]', 'href', function(err, res){
        res.forEach(function(e){
          assert.match(e, /\/faq/, 'should point to FAQ');
        });
      })
      .call(done)
  });
  after(function(done){
    client.end(done);
  });
});
