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
const Nexmo = require('nexmo');

const nexmo = new Nexmo({
  apiKey: config.NEXMO_API_KEY,
  apiSecret: config.NEXMO_API_SECRET
});

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

// Send a text mesaage
var pickupAlert = async (vendorId, pickupId) => {
  var pgClient = await pgPool.connect();
  var query = 'SELECT * FROM vendors WHERE vendor_id=$1;';
  pgClient.query(query,[vendorId], (err, results) => {
    pgClient.release();
    console.log(results.rows);
    var vendorName = results.rows[0].vendor_name;
    var text = 'Your order ' + pickupId + ' is ready for pick up from ' + vendorName;
    nexmo.message.sendSms(vendorName, '447973344381',text);
  });
}

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

// Place an order - might need to redirect in future to provide payment
app.post('/api/v1/vendors/:vendorId/orders', function (req, res) {

  var order = req.body.order;
  var vendorId = req.params.vendorId;
  var qbo = selectQbo(vendorId);

  // Compute line item amount - synchronous 
  var parallel = [];
  for(var i = 0; i < order.length; i++) {
    parallel[i] = (function(i) {return function (callback) { qbo.getItem(order[i].item_id, callback) }})(i);
  }

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

    // Get the names of the items
    for(var i = 0; i < order.length; i++) {
      for(var j = 0; j < items.length; j++) {
        if(order[i].item_id == items[j].Id) {
          order[i].item_name = items[j].Name;
        }
      }
    }

    qbo.createSalesReceipt(transaction, async (err, results) => {
      if(err) {
        console.log(err.Fault.Error);
        res.err;
      } else {
        // Calculate order timestamp
        var createTime = results.MetaData.CreateTime;
        var timestamp = Date.parse(createTime);
        // Update order database
        var pgClient = await pgPool.connect();
        const sequence = await pgClient.query("SELECT nextval('pickup_id');");
        var pickupId = sequence.rows[0].nextval;
//      const complete = await pgClient.query("SELECT DISTINCT complete FROM orders WHERE vendor_id=$1 AND order_id=$2;", [vendorId, results.Id]);
        for(var ord of order) {
          pgClient.query('INSERT INTO orders(vendor_id, order_id, item_id, qty_ordered, qty_ready, pickup_id, complete, timestamp, item_name) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9);', [vendorId, results.Id, ord.item_id, ord.qty_ordered, 0, pickupId, false, timestamp, ord.item_name]);
          ord.qty_ready = 0;
        }
        pgClient.release();

        // Build and return response
        var response = {};
        response.timestamp = timestamp;
        response.vendor_id = vendorId;
        response.order_id = results.Id;
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

// Mark an order as complete
app.post('/api/v1/vendors/:vendorId/orders/:orderId', async (req, res) => {

  var pgClient = await pgPool.connect();
  var vendorId = req.params.vendorId;
  var orderId = req.params.orderId;
  var complete = JSON.parse(req.query.complete);
  var query = 'UPDATE orders SET complete=$1 WHERE vendor_id=$2 AND order_id=$3;';
  pgClient.query(query, [complete, vendorId, orderId], (err, results) => {
    if(err) {
      console.log(err);
      res.err;
    } else {
      pgClient.release();
      res.json({});
    }
  });
});

// View a particular order
app.get('/api/v1/vendors/:vendorId/orders/:orderId', async (req, res) => {

  var vendorId = req.params.vendorId;
  var orderId = req.params.orderId;

  var pgClient = await pgPool.connect();
  var query = 'SELECT * FROM orders WHERE vendor_id=$1 AND order_id=$2';
  pgClient.query(query, [vendorId, orderId], (err, results) => {
    if(err) {
      console.log(err);
      res.err;
    } else {
       pgClient.release();
       var response = {};
       var orders = [];
       var order = {};
       order.timestamp = results.rows[0].timestamp;
       order.order_id = results.rows[0].order_id;
       order.pickup_id = results.rows[0].pickup_id;
       order.complete = results.rows[0].complete;
       var items = [];
       var rows = results.rows;
       for(var row of rows) {
         var item = {};
         item.item_id = row.item_id;
         item.item_name = row.item_name;
         item.qty_ordered = row.qty_ordered;
         item.qty_ready = row.qty_ready;
         if(item.qty_ordered == item.qty_ready) {
           item.ready = true;
         }
         items.push(item);
       }
       order.items = items;
       for(var item of items) {
         if(item.ready == true) {
           order.ready = true;
         } else {
           order.ready = false;
           break;
         }
       }
       orders.push(order);
       res.json(orders);
    }
  });
});

// View list of outstanding orders
app.get('/api/v1/vendors/:vendorId/orders', async (req, res) => {
  
  var vendorId = req.params.vendorId;
  var pgClient = await pgPool.connect();
 
  var query = 'SELECT * FROM orders WHERE vendor_id=$1 AND complete=$2 ORDER BY order_id;';
  pgClient.query(query, [vendorId, false], (err, results) => {
    if(err){
      console.log(err);
      res.err;
    } else {
      pgClient.release();
      var response = {};
      var orders = [];
      // Loop through all the rows
      var rows = results.rows;
      var curr_order_id;
      var prev_order_id = 0;
      for(var row of rows) {
        curr_order_id = row.order_id;
        if(curr_order_id != prev_order_id) {
          var order = {};
          order.timestamp = row.timestamp;
          order.order_id = row.order_id;
          order.pickup_id = row.pickup_id;
          order.complete = row.complete;
          var items = [];
          // Add item
          var item = {};
          item.item_id = row.item_id;
          item.item_name = row.item_name;
          item.qty_ordered = row.qty_ordered;
          item.qty_ready = row.qty_ready;
          if(item.qty_ordered == item.qty_ready) {
            item.ready = true;
          }
          items.push(item);
          order.items = items;
          orders.push(order);
          prev_order_id = curr_order_id;
        } else {
          // Find the order
          var order;
          for(var ord in orders) {
            if(ord.order_id == curr_order_id) {
              order = ord;
              break;
            }
          }
          // Add item
          var item = {};
          item.item_id = row.item_id;
          item.item_name = row.item_name;
          item.qty_ordered = row.qty_ordered;
          item.qty_ready = row.qty_ready;
          if(item.qty_ordered == item.qty_ready) {
            item.ready = true;
          }
          order.items.push(item);
        }
      }
      
      // Check if order is ready
      for(var ord of orders) {
        for(var item of ord.items) {
          if(item.ready == true) {
            ord.ready = true;
            if(ord.complete != true) {
              pickupAlert(vendorId, ord.pickup_id);
            }
          } else {
            ord.ready = false;
            break;
          }
        }
      }
      response.orders = orders;
      res.json(response);
    }
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

// Get details for specific vendor
app.get('/api/v1/vendors/:vendorId', async (req, res) => {
  var pgClient = await pgPool.connect();
  var query = 'SELECT * FROM vendors WHERE vendor_id=$1;';
  pgClient.query(query,[req.params.vendorId], (err, results) => {
    pgClient.release();
    res.json(results.rows);
  });
});

// Get all vendors
app.get('/api/v1/vendors', async (req, res) => {
  var pgClient = await pgPool.connect();
  var query = 'SELECT * FROM vendors';
  pgClient.query(query, (err, results) => {
    pgClient.release();
    res.json(results.rows);
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

