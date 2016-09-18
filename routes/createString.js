
var express = require('express');
var router = express.Router();

function leaveOnlyHebrew()
{

    var strippedStr = Null;
    strippedStr = strippedStr.trim();

    return strippedStr.replace('#[^א-ת ]#i', '');
}

module.exports = {
    leaveOnlyHebrew : leaveOnlyHebrew
};
module.exports = router;