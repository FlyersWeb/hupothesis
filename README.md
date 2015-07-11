What is it ?
============

Hupothesis is an evaluation form platform developed in nodeJS on my free time. I wanted to develop more the project so people would be able to use it to create evaluation forms for recruitment mainly but not only, but, because of time, I didn't integrate every feature I wanted (social sharing, PDF export, text recognition, unit tests, functional tests, etc...). The project is totally working and should help people starting with Express/NodeJS and moreover people interested in form generation with automatic time based evaluation.

Licence
=======

The project is licenced under GNU GPLv3 : http://www.gnu.org/licenses/gpl-3.0.en.html

Installation
============

You need to have nodeJS, npm and mongodb installed and running

Install dependencies using :

```
npm install
```

Run the project using :

```
npm start
```

You should access platform through http://127.0.0.1:3000. Have fun.

Launching tests
===============

Launch latest selenium server version :

```
java -jar selenium-server-standalone-2.45.0.jar
```

Launch website :

```
node ./bin/www
```

Launch functional tests :

```
mocha ./tests/functional/*
```

About
=====

@FlyersWeb
