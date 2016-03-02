process.env.NODE_ENV = 'test';

var assert = require('assert');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('supertest');

var hupothesis = require('..');


describe('hupothesis', function() {
  it('should work without form data', function(done) {
    var server = createServer();

    request(server)
    .post('/')
    .expect(200)
    .expect(function(res){
      assert.equal(res.body.score, "0", "score should be 0")
    })
    .end(done)
  });

  it('should work with simple standard form', function(done) {
    var server = createServer();

    request(server)
    .post('/')
    .set('Content-Type', "application/x-www-form-urlencoded")
    .send('answer[Q1][]=42')
    .send('ganswer[Q1]=24')
    .send('vanswer[Q1]=10')
    .send('answer[Q2][]=42')
    .send('answer[Q2][]=24')
    .send('ganswer[Q2][]=42')
    .send('ganswer[Q2][]=24')
    .send('vanswer[Q2]=10')
    .send('answer[Q3][]=answer3')
    .send('ganswer[Q3][]=0')
    .send('vanswer[Q3]=10')
    .send('timeElapsed=45')
    .send('timeMedian=30')
    .expect(200)
    .expect(function(res){
      assert.equal(res.body.score, "31.67", "score should be 0")
    })
    .end(done)
  });
});

function createServer(opts) {
  var app = express();

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(hupothesis(opts));

  app.post('/', function(req,res){
    var score = req.hupothesisEvaluation();
    res.json({'score': score});
  })

  return app.listen();
}
