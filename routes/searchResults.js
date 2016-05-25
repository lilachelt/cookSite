var express = require('express');
var router = express.Router();

/* GET searchResults page. */
router.get('/searchResults', function(req, res, next) {
    res.render('searchResults', { title: 'title'});
});

module.exports = router;
