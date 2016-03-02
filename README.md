Hupothesis
==========

Introduction
------------

Hupothesis is a form evaluation middleware. By sending it your form content (with a specific format) it will automatically evaluate the answers and return an overall score. It supports time weight so the more rapidly answers are received the more candidate score will be.

Use cases
---------

This module was first introduced by the Hupothesis platform, an evaluation portal for job candidates. But because the project did not make sense after all the alternatives, I've decided to integrate the engine as an ExpressJS middleware for others to use it if needed.

Installation
------------

Just add the package to your project

```
npm install hupothesis
```

Then just use it in your expressjs application

```
app.use(hupothesis());
```

Then in your controller get the evaluation

```
app.post('/', function(req,res){
  var score = req.hupothesisEvaluation();
  res.json({'score': score});
});
```

Working
-------

To see a working form example see the test folder. You'll need to define each answer with each good answer and the value per question. This is done using form array as name field attribute.

You can simulate a request using this curl query :

```
curl 'http://localhost:3000/' -H 'Content-Type: application/x-www-form-urlencoded' --data 'answerQ1%5B%5D=42&ganswer1=24&vanswer1=10&answerQ2%5B%5D=42&answerQ2%5B%5D=24&ganswer2%5B%5D=42&ganswer2%5B%5D=24&vanswer2=10&answerQ3%5B%5D=answer3&ganswer3%5B%5D=0&vanswer3=10&timeElapsed=45&timeMedian=30'
```

The middleware returns the evaluation in percent weighted by the time candidate took to answer.


Contributors
------------

Flyers <contact@flyers-web.org>
