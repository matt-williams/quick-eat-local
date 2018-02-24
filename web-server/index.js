'use strict';

const override = require('json-override');
const config = override(require('./config.json'), process.env);
const express = require('express');
const session = require('express-session');
const quickbooks = require('quickbooks');
const pg = require('pg');
const pgEscape = require('pg-escape');

const qbo = new quickbooks(config.QUICKBOOKS_CONSUMER_KEY,
                           config.QUICKBOOKS_CONSUMER_SECRET,
                           config.QUICKBOOKS_OAUTH_TOKEN,
                           config.QUICKBOOKS_OAUTH_TOKEN_SECRET,
                           config.QUICKBOOKS_REALM_ID,
                           config.QUICKBOOKS_REFRESH_TOKEN,
                           "2.0",
                           true,
                           true); // turn debugging on

const pgPool = new pg.Pool({
  user: "postgres",
  password: "quick-eat-local",
  database: "postgres",
  host: config.DB_HOSTNAME,
  port: 5432
});

const app = express();

app.use(session({
  store: new (require('connect-pg-simple')(session))({pool: pgPool}),
  secret: config.SESSION_COOKIE_SECRET,
  saveUninitialized: false,
  resave: false,
  cookie: {
    secure: true,
    maxAge: 30 * 24 * 60 * 60 * 1000
  }
}));
// Can now read/write from req.session...

app.get('/api/v1/stores', async (req, res) => {
  var pgClient = await pgPool.connect();
  var query = 'SELECT 1';
  pgClient.query(query, (err, results) => {
    pgClient.release();
    res.json(results.rows);
  });
});

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
