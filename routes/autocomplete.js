
var express = require('express');
var router = express.Router();
var db = require('../mongo').getDb();

/* GET home page. */
router.post('/', function(req, res, next) {
    res.contentType('application/json');
    var searchString = req.body.query;
    var result = [];
    db.collection('SearchStrings').find({'StringSearch': new RegExp(searchString, 'i') }).toArray(function (err, docs){
        if (docs.length > 0){
            for (var doc in docs){
                result.push(docs[doc]["StringSearch"]);
            }
        }
        res.send(result);
    });
});

module.exports = router;
