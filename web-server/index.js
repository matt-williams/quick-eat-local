'use strict';

const override = require('json-override');
const config = override(require('./config.json'), process.env);
const express = require('express');
const session = require('express-session');
const quickbooks = require('node-quickbooks');
const pg = require('pg');
const pgEscape = require('pg-escape');

const qbo_thai = new quickbooks(config.QUICKBOOKS_CONSUMER_KEY,
                                config.QUICKBOOKS_CONSUMER_SECRET,
                                config.THAI.OAUTH_TOKEN,
                                false,
                                config.THAI.REALM_ID,
                                true, // use sandbox
                                false, // turn debugging on
                                4, // minor version default
                                "2.0", // oAuth version
                                config.THAI.REFRESH_TOKEN);

const qbo_turkish = new quickbooks(config.QUICKBOOKS_CONSUMER_KEY,
                                   config.QUICKBOOKS_CONSUMER_SECRET,
                                   config.TURKISH.OAUTH_TOKEN,
                                   false,
                                   config.TURKISH.REALM_ID,
                                   true,
                                   false, // turn debugging on
                                   4, // minor version default
                                   "2.0", // oAuth version
                                   config.TURKISH.REFRESH_TOKEN);

const qbo_mexican = new quickbooks(config.QUICKBOOKS_CONSUMER_KEY,
                                   config.QUICKBOOKS_CONSUMER_SECRET,
                                   config.MEXICAN.OAUTH_TOKEN,
                                   false,
                                   config.MEXICAN.REALM_ID,
                                   true,
                                   false, // turn debugging on
                                   4, // minor version default
                                   "2.0", // oAuth version
                                   config.MEXICAN.REFRESH_TOKEN); // refresh token

const qbo_burgers = new quickbooks(config.QUICKBOOKS_CONSUMER_KEY,
                                   config.QUICKBOOKS_CONSUMER_SECRET,
                                   config.BURGERS.OAUTH_TOKEN,
                                   false,
                                   config.BURGERS.REALM_ID,
                                   true,
                                   false, // turn debugging on
                                   4, // minor version default
                                   "2.0", // oAuth version
                                   config.BURGERS.REFRESH_TOKEN); // refresh token

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

// Select the right qbo object
function selectQbo(id) {

  switch(id) {
    case config.THAI.REALM_ID:
      return qbo_thai;
    case config.TURKISH.REALM_ID:
      return qbo_turkish;
    case config.MEXICAN.REALM_ID:
      return qbo_mexican;
    case config.BURGERS.REALM_ID:
      return qbo_burgers;
  }
}

// Get details for specific store
app.get('/api/v1/stores/:storeId', function (req, res) {

  var id = req.params.storeId;
  var qbo = selectQbo(id);
  qbo.getCompanyInfo(id, function(err, results){
     if(err) { 
       console.log(err.fault.error);
       res.err; 
     } else {
       var info = {};
       info.name = results.CompanyName;
       res.json(info);
     }
  });
//   res.json(
//     {
//       name: "My food shop",
//       cuisine: "Japanese",
//     }
//   );
});

// Get menu for specific store
app.get('/api/v1/stores/:storeId/menu', function (req, res) {
  var qbo = selectQbo(req.params.storeId);

  qbo.findItems({type: 'Inventory'}, function(err, results) {
    if(err) {
      console.log(err.fault.error);
      res.err;
    } else {
      var items = results.QueryResponse.Item;
      var menu = [];
      for(var item of items){
        var tmp = {};
        tmp.id = item.Id;
        tmp.name = item.Name;
        tmp.price = item.UnitPrice;
        tmp.priceCurrency = "GBP";
        menu.push(tmp);
      }
      res.json({menu});
    }
  });
});

// Place an order - might need to redirect in future to provide payment
app.post('/api/v1/store/:storeId/orders', function (req, res) {
  console.log(req);
//  const body = req.body.Body;
  console.log(body); 
  var qbo = selectQbo(req.params.storeId);
  
  res.json(
    {
      timestamp: 123456789, // ms since epoch
      id: "abcdef23232",
      number: 12, // 01-99
      items: [
        {
          quantity: 3,
          id: "abcdef12567",
          description: "Phad Thai - Tofu",
          ready: 3,
        },
        {
          quantity: 2,
          id: "abcdef12569",
          description: "Thai Green Curry - Chicken",
          ready: 1,
        },
      ],
      ready: true,
      complete: false
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
