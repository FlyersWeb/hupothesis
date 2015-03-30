
var _ = require('underscore');

function FileAnswered(file) {
  this.file = file || null;
  this.contestants  = {};
}
FileAnswered.prototype.addAnswer = function(answer) {
  if(typeof this.contestants[answer.contestant._id] == "undefined")
    this.contestants[answer.contestant._id] = [answer];
  else
    this.contestants[answer.contestant._id].push(answer);
  return this;
};
FileAnswered.prototype.computeMedian = function() {
  return this;
};

function PollAnswered(poll) {
  this.poll = poll || null;
  this.contestants  = {};

  this.scores       = {};

  this.timestampMedian  = null;
  this.pointsMedian     = null;
}
// add answer storing points
PollAnswered.prototype.addAnswer = function(question) {
  var that = this;
  _.each(question.answers, function(answer){
    answer.points = 0;
    answer.totalPoints = _.reduce(question.points, function(m, c) { 
      var c = parseInt(c);
      var m = parseInt(m);
      var ret = parseInt(m+c);
      return ret;
      // if(ret>=0) {
      //   return ret;
      // } else if(c>=0) {
      //   return c;
      // } else {
      //   return 0;
      // }
    });
    _.each(answer.value, function(val){
      var idx = _.indexOf(question.choices, val);
      if(idx>=0) answer.points += parseInt(question.points[idx]);
    });
    if(typeof that.contestants[answer.contestant._id] == "undefined")
      that.contestants[answer.contestant._id] = [answer];
    else  
      that.contestants[answer.contestant._id].push(answer);
  });
  return this;
};
// compute timestamp mediane
PollAnswered.prototype.computeMedian = function() {
  var that = this;
  var timestamps = [];
  var medIdx = 0;
  _.each(this.contestants, function(answers){
    _.each(answers, function(answer){
      timestamps.push(answer.ansTime);
    });
  });
  timestamps = timestamps.sort();
  medIdx = Math.floor(timestamps.length/2)-1;

  if(typeof timestamps[medIdx] != "undefined")
    this.timestampMedian = timestamps[medIdx];

  return this;
};
// compute total poll points
PollAnswered.prototype.computePoints = function() {
  
  var points = [];

  _.each(this.contestants, function(answers){
    _.each(answers, function(answer){
      points.push(answer.points);
    });
  });

  points = points.sort();
  medPts = Math.floor(points.length/2)-1;

  if(typeof points[medPts] != "undefined")
    this.pointsMedian = points[medPts];

  return this;
};
// compute score ponderated with answer time or not
PollAnswered.prototype.computeScore = function(withTimestamp) {
  var that = this;
  this.computePoints().computeMedian();

  var withTimestamp = withTimestamp || true;

  _.each(this.contestants, function(answers, contestantId){
    _.each(answers, function(answer){
      if(withTimestamp) {
        var timestampScore = ((answer.ansTime-that.timestampMedian)/that.timestampMedian)*-1;
        var score = answer.points+timestampScore;
      } else {
        var score = answer.points;
      }
      if(typeof that.scores[contestantId] == "undefined")
        that.scores[contestantId] = score;
      else
        that.scores[contestantId] += score;
    });
  });
  return this;
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
  this.computeScore();
}

// prepare data for processing
Processor.prototype.prepareData = function() {
  var ret = {};

  var calculateAnswerTime = function(viewed, answered) {
    var ret = 0;
    if( answered && viewed )
      ret = answered.getTime()-viewed.getTime();
    if(ret<0) ret = 0;
    return ret;
  };

  var user = this.user.toObject();

  var dfiles = [];
  for (var i=0; i<this.files.length; i++) {
    var file = this.files[i];
    var fileAnswered = new FileAnswered(file);
    file = file.toObject();
    file.answers = [];
    for(var j=0; j<this.fanswers.length; j++) {
      var fanswer = this.fanswers[j];
      fanswer = fanswer.toObject();
      fanswer.ansTime = calculateAnswerTime(fanswer.viewed, fanswer.added);
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
    var poll = this.polls[i];
    var pollAnswered = new PollAnswered(poll);
    poll = poll.toObject();
    poll.questions = [];
    for(var j=0; j<this.pquestions.length; j++) {
      var pquestion = this.pquestions[j];
      pquestion = pquestion.toObject();
      pquestion.answers = [];
      for(var k=0; k<this.panswers.length; k++) {
        var panswer = this.panswers[k];
        panswer = panswer.toObject();
        panswer.ansTime = calculateAnswerTime(panswer.viewed, panswer.added);
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

// get Data for view
Processor.prototype.getData = function() {

  var that = this;

  _.each(this.data.user.polls, function(poll){
    var apoll = that.getPollById(poll['_id'].toString(), function(apoll){
      _.each(poll.questions, function(question){
        _.each(question.answers, function(answer){
          answer.contestant['score'] = apoll.scores[answer.contestant['_id'].toString()];
        });
      });
    });
  });

  return this.data;
};

// process answer total points
Processor.prototype.computeScore = function() {
  var that = this;
  _.each(this.answered.polls, function(p){
    p.computeScore();
  });
  return this;
};

Processor.prototype.getPollById = function(id, cb) {
  var that=this;
  _.each(this.answered.polls, function(p){
    if(p.poll['_id'].toString() == id) cb(p);
  });
}

Processor.prototype.debug = function() {
  _.each(this.answered.files, function(e){
    console.log("file", e)
  });
  _.each(this.answered.polls, function(e){
    console.log("poll", e)
  });
};

module.exports = Processor;