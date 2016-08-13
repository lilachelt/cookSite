/**
 * Created by mor.schwartz on 13/08/2016.
 */
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('noResult', { title: 'no Result'}); //http://localhost:3000/noResult
});

module.exports = router;
