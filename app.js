var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongodb = require('mongodb').MongoClient;
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var hbs = require('hbs');
var ObjectID = require('mongodb').ObjectID;


var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();


var db1;
var coll1;


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

MongoClient.connect("mongodb://Vmedu94.mtacloud.co.il:27017/cook", function(err, db) {

  if(err) throw err;

  assert.equal(null, err);

  console.log("Successfully connected to MongoDB.");

  app.post('/searchResults', function(req, res, next) {
    searchString = req.body.search;

    if (typeof searchString == 'undefined'){
      next(Error('Please insert search string!'));
    }

    db.collection('SearchStrings').find({'StringSearch': searchString}).toArray(function (err, docs) {

      if (err) throw err;

      if (docs.length < 1) {
        console.dir("No documents found.");
        // return res.send("No documents found. Did you forget to mongorestore?");
      } else {
        console.dir("Documents found!");
        console.dir(docs);
        
        if (docs != null){
          for (var doc in docs) {
            var linksId = docs[doc]["Links"];
            var urlsArr =new Array(linksId.length);
            getUrlsFromSearchResults(function(linksId, urlsArr){
              console.dir(urlsArr[0]);
            });
            res.render('index', {searchResults: urlsArr});}
        } else{
          //goto robot
        }
      }

    });

  });

   // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
//
// function getUrlsFromSearchResults(linksId){
//   var arrLinks = new Array(linksId.length);
//
//   MongoClient.connect("mongodb://Vmedu94.mtacloud.co.il:27017/cook", function(err, db)
//   {
//     //if (err) throw err;
//     assert.equal(null,err);
//     db1 = db;
//     coll1 = db.collection('Links');
//   });
//       for (var i = 0; i < linksId.length; i++)
//       {
//         coll1.find({_id: new ObjectID(linksId[i])}).toArray(function (err, doc)
//         {
//           if (err) throw err;
//             arrLinks[i] = doc[0]['Link'];
//         });
//       }
//
//   console.dir(arrLinks[2]);
//   return arrLinks;
// };

var getUrlsFromSearchResults = function(linksId, callback){
  var arrLinks = new Array(linksId.length);
  MongoClient.connect("mongodb://Vmedu94.mtacloud.co.il:27017/cook", function(err, db) {
    if (err) throw err;
    for (i = 0; i < linksId.length; i++) {
      db.collection('Links').find({_id: new ObjectID(linksId[i])}).toArray(function (err, doc) {
        if (err) throw err;
        // console.dir(doc);
        arrLinks[i]= doc[0]['Link'];
        console.dir(arrLinks[i]);
      })
    }
    callback (arrLinks);
  });
};
