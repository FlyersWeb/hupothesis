
var _ = require('underscore');


function FileAnswered() {
  this.answers = [];
}
FileAnswered.prototype.addAnswer = function(answer) {
  this.answers.push(answer);
  return this;
};
FileAnswered.prototype.computeMedian = function() {
  return this;
};

function PollAnswered() {
  this.answers = [];
}
PollAnswered.prototype.addAnswer = function(question) {
  var that = this;
  _.each(question.answers, function(answer){
    answer.points = 0;
    answer.totalPoints = _.reduce(question.points, function(p, c) { return parseInt(c)+parseInt(p); });
    _.each(answer.value, function(val){
      var idx = _.indexOf(question.choices, val);
      if(idx>=0) answer.points += parseInt(question.points[idx]);
    });
    that.answers.push(answer);
  });
  return this;
};
PollAnswered.prototype.computeMedian = function() {
  var points = [];
  var medIdx = 0;
  _.each(this.answers, function(answer){
    points.push(answer.points);
  });
  points = points.sort();
  medIdx = Math.floor(points.length/2);
  return points[medIdx];
};

function Processor(user, files, fanswers, polls, pquestions, panswers, contestants) {
  this.user       = user || {};
  this.files      = files || {};
  this.fanswers   = fanswers || {};
  this.polls      = polls || {};
  this.pquestions = pquestions || {};
  this.panswers   = panswers || {};
  this.contestants  = contestants || {};

  this.answered = {};
  this.answered.files = [];
  this.answered.polls = [];

  this.data       = {};
  this.prepareData();
}

Processor.prototype.calculateAnswerTime = function(viewed, answered) {
  var ret = 0;
  if( answered && viewed )
    ret = answered.getTime()-viewed.getTime();
  if(ret<0) ret = 0;
  return ret;
};

// prepare data for processing
Processor.prototype.prepareData = function() {
  var ret = {};

  var user = this.user.toObject();

  var dfiles = [];
  for (var i=0; i<this.files.length; i++) {
    var fileAnswered = new FileAnswered();
    var file = this.files[i];
    file = file.toObject();
    file.answers = [];
    for(var j=0; j<this.fanswers.length; j++) {
      var fanswer = this.fanswers[j];
      fanswer = fanswer.toObject();
      fanswer.ansTime = this.calculateAnswerTime(fanswer.viewed, fanswer.added);
      for(var k=0; k<this.contestants.length; k++){
        var contestant = this.contestants[k];
        if(fanswer.contestant.toString() == contestant._id.toString()) {
          fanswer.contestant = contestant.toObject();
        }
      }
      if(fanswer.blob.toString() == file._id.toString()){
        fileAnswered.addAnswer(fanswer);
        file.answers.push(fanswer);
      }
    }
    dfiles.push(file);
    this.answered.files.push(fileAnswered);
  }

  var dpolls = [];
  for(var i=0; i<this.polls.length; i++) {
    var pollAnswered = new PollAnswered();
    var poll = this.polls[i];
    poll = poll.toObject();
    poll.questions = [];
    for(var j=0; j<this.pquestions.length; j++) {
      var pquestion = this.pquestions[j];
      pquestion = pquestion.toObject();
      pquestion.answers = [];
      for(var k=0; k<this.panswers.length; k++) {
        var panswer = this.panswers[k];
        panswer = panswer.toObject();
        panswer.ansTime = this.calculateAnswerTime(panswer.viewed, panswer.added);
        for(var l=0; l<this.contestants.length; l++){
          var contestant = this.contestants[l];
          if(panswer.contestant.toString() == contestant._id.toString()) {
            panswer.contestant = contestant.toObject();
          }
        }
        if(panswer.question.toString() == pquestion._id.toString()) {
          pquestion.answers.push(panswer);
        }
      }
      if(pquestion.blob.toString() == poll._id.toString()){
        pollAnswered.addAnswer(pquestion);
        poll.questions.push(pquestion);
      }
    }
    dpolls.push(poll);
    this.answered.polls.push(pollAnswered);
  }

  ret.user = user;
  ret.user.files = dfiles;
  ret.user.polls = dpolls;

  this.data = ret;

  return this;
};


// process answer total points
Processor.prototype.computePoints = function() {
  console.log(this.data);
  return this;
};

// get answers median points
Processor.prototype.computeMedian = function(obj) {
  var points 
  var answers = obj.answers;
  _.each(answers,function(answer){

  });
  return this;
};

Processor.prototype.debug = function() {
  _.each(this.answered.files, function(e){
    console.log("file", e)
  });
  _.each(this.answered.polls, function(e){
    console.log("poll", e)
  });
};

module.exports = Processor;