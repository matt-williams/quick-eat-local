'use strict';

const override = require('json-override');
const config = override(require('./config.json'), process.env);

console.log(config);

const express = require('express');
const quickbooks = require('quickbooks');

const qbo = new quickbooks(config.QUICKBOOKS_CONSUMER_KEY,
                           config.QUICKBOOKS_CONSUMER_SECRET,
                           config.QUICKBOOKS_OAUTH_TOKEN,
                           config.QUICKBOOKS_OAUTH_TOKEN_SECRET,
                           config.QUICKBOOKS_REALM_ID,
                           config.QUICKBOOKS_REFRESH_TOKEN,
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
  server: config.LETSENCRYPT_SERVER,
  email: config.LETSENCRYPT_EMAIL,
  agreeTos: true,
  approveDomains: config.LETSENCRYPT_DOMAINS,
  app: app
}).listen(80, 443);
