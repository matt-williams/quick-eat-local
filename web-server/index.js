'use strict';

const override = require('json-override');
const config = override(require('./config.json'), process.env);
const express = require('express');
const session = require('express-session');
const quickbooks = require('node-quickbooks');
const pg = require('pg');
const pgEscape = require('pg-escape');
const bodyParser = require('body-parser');
const async = require('async');

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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

// Get all vendors
app.get('/api/v1/vendors', async (req, res) => {
  var pgClient = await pgPool.connect();
  var query = 'SELECT * FROM vendors';
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

// Get details for specific vendor
app.get('/api/v1/vendors/:vendorId', async (req, res) => {

  var pgClient = await pgPool.connect();
  var query = 'SELECT * FROM vendors WHERE vendor_id=$1;';
  pgClient.query(query,[req.params.vendorId], (err, results) => {
    pgClient.release();
    res.json(results.rows);
  });
});

// Get menu for specific vendor
app.get('/api/v1/vendors/:vendorId/menu', function (req, res) {

  var qbo = selectQbo(req.params.vendorId);
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
app.post('/api/v1/vendors/:vendorId/orders', function (req, res) {

  var order = req.body.order;
  var vendorId = req.params.vendorId;
  var qbo = selectQbo(vendorId);

  // Get item ids
  var parallel = [];
  for(var i = 0; i < order.length; i++) {
    parallel[i] = (function(i) {return function (callback) { qbo.getItem(order[i].item_id, callback) }})(i);
  }

  // Compute line item amount - synchronous 
  async.parallel(parallel, function (err, items) {
    // Create sales receipt
    var line = [];
    var salesReceipt = {};
    for(var i = 0; i < order.length; i++) {
      var lineItem = {};
      var salesItemLineDetail = {};
      var itemRef = {};
      itemRef.value = order[i].item_id;
      salesItemLineDetail.ItemRef = itemRef;
      salesItemLineDetail.Qty = order[i].qty_ordered;
      lineItem.LineNum = i+1;
      lineItem.Amount = items[i].UnitPrice * order[i].qty_ordered;
      lineItem.DetailType = "SalesItemLineDetail";
      lineItem.SalesItemLineDetail = salesItemLineDetail;
      line.push(lineItem);
    }

    var transaction = {};
    transaction.Line = line;
    console.log(transaction);
    qbo.createSalesReceipt(transaction, async (err, results) => {
      if(err) {
        console.log(err.Fault.Error);
        res.err;
      } else {
        // Update order database
        var pgClient = await pgPool.connect();
        const sequence = await pgClient.query("SELECT nextval('pickup_id');");
        var pickupId = sequence.rows[0].nextval;
//      const complete = await pgClient.query("SELECT DISTINCT complete FROM orders WHERE vendor_id=$1 AND order_id=$2;", [vendorId, results.Id]);
        for(var ord of order) {
          pgClient.query('INSERT INTO orders(vendor_id, order_id, item_id, qty_ordered, qty_ready, pickup_id, complete) VALUES($1, $2, $3, $4, $5, $6, $7);', [vendorId, results.Id, ord.item_id, ord.qty_ordered, 0, pickupId, false]);
          ord.qty_ready = 0;
        }
        pgClient.release();

        // Build and return response
        var createTime = results.MetaData.CreateTime;
        var timestamp = Date.parse(createTime);
        var response = {};
        response.timestamp = timestamp;
        response.vendor_id = vendorId;
        response.pickup_id = pickupId;
        response.items = order;
        response.ready = false;
        response.complete = false;

        res.json(response);
      }
    });
  });
});

// Update number of ready items for a specific order
app.post('/api/v1/vendors/:vendorId/orders/:orderId/items/:itemId', async (req, res) => {

  var pgClient = await pgPool.connect();
  var vendorId = req.params.vendorId;
  var orderId = req.params.orderId;
  var itemId = req.params.itemId;
  var qty_ready = parseInt(req.query.ready, 10);
  var query = 'UPDATE orders SET qty_ready=$1 WHERE vendor_id=$2 AND order_id=$3 AND item_id=$4;';
  pgClient.query(query, [qty_ready, vendorId, orderId, itemId], (err, results) => {
    if(err) {
        console.log(err);
        res.err;
    } else {
      var select = 'SELECT * FROM orders WHERE vendor_id=$1 AND order_id=$2;';
      pgClient.query(select, [vendorId, orderId], (err, results) => {
        if(err) {
          console.log(err);
          res.err;
        } else {
          // Check if order is now ready
          //var complete = false;
          //var items = results.rows;
          //for(var item of items) {
          //  if(item.qty_ordered = item.qty_ready) {
          //    var update = 'UPDATE orders SET complete=true WHERE vendor_id=$1 AND order_id=$2 AND item_id=$3;';
          //    pgClient.query(update, [vendorId, orderId, itemId], (err, results) => {
          //      if(err) {
          //        console.log(err);
          //        res.err;
          //      }
          //    }
          //  }
          //}
          res.json(results.rows);
          pgClient.release();
        }
      });
    }
  });
});

app.use('/', express.static('public'));
 
require('letsencrypt-express').create({
  server: config.LETSENCRYPT_SERVER,
  email: config.LETSENCRYPT_EMAIL,
  agreeTos: true,
  approveDomains: config.LETSENCRYPT_DOMAINS,
  app: app
}).listen(80, 443);
