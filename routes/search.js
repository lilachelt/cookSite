var express = require('express');
var router = express.Router();

/* GET searchResults page. */
router.get('/', function(req, res, next) {
    // res.render('search', { title: 'title'});
    res.render('search', { title: 'search page', layout: false });
});

module.exports = router;
