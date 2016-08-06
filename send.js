/**
 * Created by mor.schwartz on 04/08/2016.
 */
const express = require('express');
var amqp = require('amqplib/callback_api');


function connect(callback){
    amqp.connect('http://vmedu94.mtacloud.co.il:15672', function(err, conn) {
        console.log('successfully connected TO RabbitMQ');
        conn.createChannel(function(err, ch) {
            var q = 'hello';

            ch.assertQueue(q, {durable: false});
            ch.sendToQueue(q, Buffer.from('Hello World!'));
            console.log(" [x] Sent 'Hello World!'");
        });
    });
}


module.exports = {
    getMQ : function(){
        return db;
    },
    connect : connect
};

module.exports