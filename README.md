The OpenShift `nodejs` cartridge documentation can be found at:

http://openshift.github.io/documentation/oo_cartridge_guide.html#nodejs


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