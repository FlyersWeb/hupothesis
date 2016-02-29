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

Options
-------

Work in progress

Contributors
------------

Flyers <contact@flyers-web.org>
