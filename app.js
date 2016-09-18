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

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.use('/noResult', noResult);
app.use('/autocomplete',autocomplete);

var flagForRabbit = 0; // 0 if is the first search , otherwise 1
var map = {};
var mapIngWord = {};
var mapIncludeSign = {};


  app.post('/', function(req, res, next) {
      var searchString = req.body.search;

      if (searchString.indexOf("+") != -1)
      {
          var words = searchString.split("+");
          var searchString = words[0];
          if(searchString[searchString.length-1]==" ")
          {
              searchString = searchString.substr(0,searchString.length-1);
          }
          if(words[1] != null)
          {
              mapIngWord[searchString] = words[1].replace(/\s/g, '');
              mapIncludeSign[searchString] = "+";
          }
      }
      if (searchString.indexOf("-") != -1)
      {
          var words = searchString.split("-");
          var searchString = words[0];
          if(searchString[searchString.length-1]==" ")
          {
              searchString = searchString.substr(0,searchString.length-1);
          }
          if(words[1] != null)
          {
              mapIngWord[searchString] = words[1].replace(/\s/g, '');
              mapIncludeSign[searchString] = "-";
          }
      }

      if(map[searchString] != null)
      {
          map[searchString] = 1;
      }
      else
      {
          map[searchString] = 0;
      }

      var isContinueSearch = (req.body.isContinueSearch == "yes");
          //TODO delete links after??
      if (searchString != '') {
           /*Show the search key word in the search box after 'search' button clicked.*/
          runOperationSearch(searchString, isContinueSearch,res,function (linksId) {
              getAllDataFromDbBySearchString(searchString, linksId, mapIncludeSign[searchString],  mapIngWord[searchString], function (arrayDataResult) {
                  res.render('index', {arrayDataResult: arrayDataResult, searchString: searchString});
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

function mergeArraysToOneArray(searchString, includeSign, ingWord, titlesUrlsArr, linksUrlsArr,LinksImages,ingredientsNamesArr ,TagsNamesArr,callback) {

    var arrResult = new Array(linksUrlsArr.length);

    for (var j=0,i = 0; j < arrResult.length; j++) {
        //check ingredients include or not include
        if(ingWord != null){
            if(ingredientsNamesArr[j] != null){
                var ind = ingredientsNamesArr[j].indexOf(ingWord);
                if(includeSign=="+")
                {
                    console.log(ingredientsNamesArr[j]);
                    if(ind == -1){
                        continue;
                    }
                }
                else if(includeSign=="-")
                {
                    console.log(ingredientsNamesArr[j]);
                    if(ind != -1){
                        continue;
                    }
                }
            }
            else{
                continue;
            }
        }

        arrResult[i] = new Array(5);
        arrResult[i][0] = titlesUrlsArr[j];
        arrResult[i][1] = linksUrlsArr[j];
        arrResult[i][2] = LinksImages[j];
        arrResult[i][3] = ingredientsNamesArr[j];
        arrResult[i][4] = TagsNamesArr[j];
        i++;
    }

    if(mapIncludeSign[searchString] != null)
    {
        delete mapIncludeSign[searchString];
    }

    if(mapIngWord[searchString] != null)
    {
        delete mapIngWord[searchString];
    }

    if(map[searchString] != null)
    {
        delete map[searchString];
    }

    if(arrResult.length > i)
    {
        var arrResultNew = new Array(i);
        for (var j=0; j < i; j++)
        {
            arrResultNew[j] = arrResult[j];
        }
        callback(arrResultNew);
    }
    else
    {
        callback(arrResult);
    }
}

function getAllDataFromDbBySearchString(searchString, linksId, includeSign, ingWord, callback) {
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

                        buildItemsDetailsArray(db,IDsIngredientsArr,'Ingredients','Word',function(ingredientsNames){

                            getDataFromDbUsingLinksId(linksId,db,'Links','Tags','_id',function(TagsIDArr) {

                                buildItemsDetailsArray(db,TagsIDArr,'Tags','Word',function(tagsNamesArr){

                                /**
                                 * merge all the data to one big array in order to display it to web page
                                 */
                                mergeArraysToOneArray(searchString, includeSign, ingWord, titlesUrlsArr, linksUrlsArr, LinksImages, ingredientsNames ,tagsNamesArr ,function (arrayDataResult) {
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

function runOperationSearch(searchString, isContinueSearch,res,callback) {

    db.collection('SearchStrings').find
    ({$or :[{'StringSearch': searchString},{'LikeSearchString': {$in: [searchString]}}]}).toArray(function (err, docs) {
        if (err) throw err;

        if (docs.length < 1) {
            //send to RabbitMQ the string that was not found in DB
            if (map[searchString] == 0) {
                map[searchString] = 1;
                rabbitMqSend(searchString);
            }
            if (isContinueSearch) {
                res.json({isSuccess: "false"});
            }
            else {
                res.render('noResult', {isContinueSearch: "yes", searchString: searchString});
            }
        }
        else {
                for (var doc in docs) {
                    var linksId = docs[doc]["Links"];
                }
                callback(linksId);
            }

    });
}



