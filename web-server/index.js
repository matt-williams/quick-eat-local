'use strict';

var app = require('express')()

app.use('/', function (req, res) {
  res.end('Hello, World!');
})
 
require('letsencrypt-express').create({
  server: 'staging',
  email: 'matwilliams@hotmail.com',
  agreeTos: true,
  approveDomains: [ 'quick.eat.local.uk.to' ],
  app: app
}).listen(80, 443);
