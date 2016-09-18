var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('noResult', { title: 'no Result'});
});

module.exports = router;
