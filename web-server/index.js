'use strict';

const config = require('./config.json');
const express = require('express');
const quickbooks = require('quickbooks');

const qbo = new quickbooks(config.CONSUMER_KEY,
                           config.CONSUMER_SECRET,
                           config.OAUTH_TOKEN,
                           config.OAUTH_TOKEN_SECRET,
                           config.REALM_ID,
                           config.REFRESH_TOKEN,
                           "2.0",
                           true,
                           true); // turn debugging on

const app = express();

app.get('/api/v1/orders', function (req, res) {
  res.json(
    {
      orders: [
        {
          timestamp: 123456789, // ms since epoch
          number: 12, // 01-99
          items: [
            {
              quantity: 3,
              description: "Phad Thai - Tofu",
              ready: 3,
            },
            {
              quantity: 2,
              description: "Thai Green Curry - Chicken",
              ready: 1,
            },
          ],
          ready: true,
          complete: false
        }
      ]
    }
  );
});

app.use('/', express.static('public'));
 
require('letsencrypt-express').create({
  server: 'staging',
  email: 'matwilliams@hotmail.com',
  agreeTos: true,
  approveDomains: [ 'quick.eat.local.uk.to' ],
  app: app
}).listen(80, 443);
