process.env.NODE_ENV = 'test';

var assert = require('assert');
var connect = require('connect');
var http = require('http');
var bodyParser = require('body-parser');
var request = require('supertest');

var hupothesis = require('..');


describe('hupothesis', function() {
  it('should work without form data', function(done) {
    var server = createServer();

    request(server)
    .post('/')
    .expect(200, done)
  });
});

function createServer(opts) {
  var app = connect();

  app.use(bodyParser.urlencoded({extended: false}));
  app.use(hupothesis(opts));

  app.use(function(req,res) {
    res.end('none');
  });

  return http.createServer(app);
}
