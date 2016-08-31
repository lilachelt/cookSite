var _ = require('underscore');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var hbs = require('hbs');
var ObjectID = require('mongodb').ObjectID;
var db = require('./mongo').getDb();

var routes = require('./routes/index');
var users = require('./routes/users');
var noResult = require('./routes/noResult');
var autocomplete = require('./routes/autocomplete');

var app = express();
var rabbitMqSend = require('./send').send;

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
app.use('/noResult', noResult);
app.use('/autocomplete',autocomplete);


  app.post('/', function(req, res, next) {
      var searchString = req.body.search;
          //TODO delete links after??
      if (searchString != '') {
           /*Show the search key word in the search box after 'search' button clicked.*/
            req.body.search = searchString;
          runOperationSearch(searchString, res,function (linksId) {
              getAllDataFromDbBySearchString(linksId, function (arrayDataResult) {
                  res.render('index', {arrayDataResult: arrayDataResult});
              });
          });
      }
  });


//////////////////////////
   // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
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

function getDataFromDbUsingLinksId(linksId, db, collectionName, itemName, searchParam, onResults) {

    var arrDataLinks = new Array;

    if (linksId != null) {

        arrDataLinks = Array(linksId.length);
        var mongoIds = [];
        var query = {};

        if (searchParam == '_id') {
            linksId.forEach(function (id) {
                mongoIds.push(new ObjectID(id));
            });
        } else {
            mongoIds = linksId;
        }

        query[searchParam] = {$in: mongoIds};

        db.collection(collectionName).find(query).toArray(function (err, doc) {
            if (err) throw err;

            arrDataLinks = _.map(doc, function (item) {
                return item[itemName]
            });

            onResults(arrDataLinks);
        });
    }
    else
    {
         arrDataLinks.push('');
         onResults(arrDataLinks);
    }

        return arrDataLinks;
}

function buildItemsDetailsArray(db, itemsIdsArr,collectionName,searchParam, callback) {

    itemsResultsArr = [];
    counter = 0;
    IdsArrLength = itemsIdsArr.length;

    for (var i = 0; i < IdsArrLength; i++) {

        getDataFromDbUsingLinksId(itemsIdsArr[i], db, collectionName, searchParam, '_id', function (itemNames) {
            counter++;

            itemsResultsArr.push(itemNames);

            if (counter === IdsArrLength) {

                callback(itemsResultsArr);
            }
        });
    }
}

function mergeArraysToOneArray(titlesUrlsArr, linksUrlsArr,LinksImages,ingredientsNamesArr ,TagsNamesArr,callback) {

    var arrResult = new Array(linksUrlsArr.length);

    for (var i = 0; i < arrResult.length; i++) {
        arrResult[i] = new Array(5);
        arrResult[i][0] = titlesUrlsArr[i];
        arrResult[i][1] = linksUrlsArr[i];
        arrResult[i][2] = LinksImages[i];
        arrResult[i][3] = ingredientsNamesArr[i];
        arrResult[i][4] = TagsNamesArr[i];
    }

    callback(arrResult);
}

function getAllDataFromDbBySearchString(linksId,callback) {
    /**
     * get all the titles using links ID from collection 'Links'
     */
    getDataFromDbUsingLinksId(linksId, db, 'Links', 'Title', '_id', function(titlesUrlsArr) {
        /**
         * get all the urls using links ID from collection 'Links'
         */

        getDataFromDbUsingLinksId(linksId, db, 'Links', 'Link', '_id', function(linksUrlsArr) {
            /**
             * get all the Ingredients IDs using links ID from collection 'Links'
             */

            getDataFromDbUsingLinksId(linksId, db, 'Links', 'ImagePath', '_id', function(LinksImages) {
                /**
                 * get all the Ingredients IDs of each recipe using Ingredients ID from collection 'LinksToWords'
                 */
                getDataFromDbUsingLinksId(linksId, db, 'Links', 'Ingredients', '_id', function(IngredientsIDArr) {

                    getDataFromDbUsingLinksId(IngredientsIDArr,db,'LinksToWords','Words','_id',function(IDsIngredientsArr) {

                        buildItemsDetailsArray(db,IDsIngredientsArr,'Ingredients','Word',function(ingredientsNames) {

                            getDataFromDbUsingLinksId(linksId,db,'Links','Tags','_id',function(TagsIDArr) {

                                buildItemsDetailsArray(db,TagsIDArr,'Tags','Word',function(tagsNamesArr){

                                /**
                                 * merge all the data to one big array in order to display it to web page
                                 */
                                mergeArraysToOneArray(titlesUrlsArr, linksUrlsArr, LinksImages, ingredientsNames ,tagsNamesArr ,function (arrayDataResult) {
                                    callback(arrayDataResult);
                                    return arrayDataResult;

                                  });
                                });

                            });
                        });
                    });
                });
            });
        });
    });

 }

function runOperationSearch(searchString,res, callback) {

        db.collection('SearchStrings').find({'StringSearch': searchString}).toArray(function (err, docs){
            if (err) throw err;

            if (docs.length < 1) {
                //searching the string in LikeSearchString field
                db.collection('SearchStrings').find({'LikeSearchString': searchString}).toArray(function (err, docs)
                {
                    if (docs.length < 1)
                    {
                        //send to RabbitMQ the string that was not found in DB
                        rabbitMqSend(searchString);
                        //setTimeout(runOperationSearch(searchString,res),30000);
                        //runOperationSearch(searchString,res);
                        res.render('noResult');

                    }
                    else
                    {
                        for (var doc in docs) {
                            var linksId = docs[doc]["Links"];
                        }
                        callback(linksId);
                    }
                });
                console.dir("No documents found.");

                //rabbitMqSend(searchString);
                //res.render('noResult');
         // search the data and introduce the result
            } else {
                for (var doc in docs) {
                    var linksId = docs[doc]["Links"];
                }
                // Check if links list is Empty --> send to Queue
                if(!(linksId[0])){
                    rabbitMqSend(searchString);
                    res.render('noResult');
                }
                callback(linksId);
            }

        });
}


