/**
 * Created by mor.schwartz on 04/08/2016.
 */
const express = require('express');
var amqp = require('amqplib/callback_api');

var channel = undefined;
var q = 'stringToSearch';

function connect(urlRabbit, callback){
    amqp.connect(urlRabbit,function(err, conn) {

        if (err){
            callback(err,conn);
        } else {
            console.log('successfully connected to RabbitMQ');
            conn.createConfirmChannel(function(err, ch) {
                channel = ch;
                channel.assertQueue(q, {durable: false});

                callback(err,channel);
            });
        }
    });
}

function send(str,callback){
    //var q = 'hello';
    channel.sendToQueue(q, new Buffer(str), {}, function(err,ok){
        if(err){
            throw err;
            console.log('Error send to Queue');
        }
        console.log('send callback', arguments);
    });

}

module.exports = {
    connect : connect,
    send : send
};