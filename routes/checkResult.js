/**
 * Created by mor.schwartz on 03/09/2016.
 */
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('checkResult', { title: 'checkResult'});
});

module.exports = router;