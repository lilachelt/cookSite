/**
 * Created by mor.schwartz on 27/08/2016.
 */
var express = require('express');
var router = express.Router();

function leaveOnlyHebrew()
{

    var strippedStr = Null;
    strippedStr = strippedStr.trim();

    return strippedStr.replace('#[^א-ת ]#i', '');
}

//console.log(leaveOnlyHebrew("azאב azטו"));//only hebrew and spaces

//var_dump(leaveOnlyHebrew("azxc   gfh"));//empty
module.exports = {
    leaveOnlyHebrew : leaveOnlyHebrew
};
module.exports = router;