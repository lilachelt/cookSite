var express = require('express');
var router = express.Router();

/* GET searchResults page. */
router.get('/', function(req, res,next) {
    res.render('searchResults', { title: 'Results', layout: false }); //http://localhost:3000/searchResults
});

module.exports = router;
