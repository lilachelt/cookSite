var MongoClient = require('mongodb').MongoClient;

var db = undefined;

function connect(callback){
    MongoClient.connect("mongodb://Vmedu94.mtacloud.co.il:27017/cook", function(err, database){
        console.log('successfully connected to DB');
        db = database;
        callback(err,db);
    });
}

module.exports = {
    getDb : function(){
        return db;
    },
    connect : connect
};

