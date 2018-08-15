const express = require('express');
const request = require('request');
const pg = require('pg');
const rp = require('request-promise');
const up = require('./Logic/updater');
const parser = require('./Logic/JSONStripper')
const util = require('./Logic/util')
const config = require('./config/main')
var app = express();

const connectionString = config.connectionString;

//Establish DB pool
const pool = new pg.Pool({
    connectionString : config.connectionString,
})


app.get('/carparks', function (req, res) {
    up.getVacancyInfo(pool)
        .then( (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data) );
        })
        .catch(util.onRejectPrintMsg);

});


app.get('/carparks/:id', function (req, res) {
    up.getVacancyInfoByID(pool, req.params.id)
        .then( (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data) );
        })
        .catch(util.onRejectPrintMsg);
});


app.get('/vacancy', function (req, res) {
    up.getInfoFromGov()
        .then( (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.status(200);
            res.end(JSON.stringify(data) );
        })
        .catch( (err) => {
            util.onRejectPrintMsg(err);
            res.status(500);
            res.end();
        });
});



app.post('/carparks', function (req, res) {

    //TBC: Send response with insert success
    res.status(200);
    res.end();

    //Perform process
    const client = new pg.Client(connectionString);
    client.connect();

    up.updateCarparkInfo(client)
        .then( (v)=> console.log("Insert success: ", v))
        .catch(util.onRejectPrintMsg)
        .then(() => { client.end();});

});


app.post('/vacancy', function (req, res) {
    const client = new pg.Client(connectionString);
    const con = client.connect();

    up.updateVacancyInfo(client)
        .then( (v)=> console.log("Insert success: ", v))
        .catch(util.onRejectPrintMsg)
        .then(() => {
            console.log("Shut down anyway");
            client.end();});
    res.status(200);
    res.end();
});


function updateVacancy () {

    const client = new pg.Client(connectionString);
    const con = client.connect();

    up.updateVacancyInfo(client)
        .then( (v)=> console.log("Insert success: ", v))
        .catch(util.onRejectPrintMsg)
        .then(() => {
            console.log("Shut down anyway");
            client.end();});

}

//Really really bad (temp setup)
 setInterval(updateVacancy, 1000*60*10);

app.listen(3000, function (req, res) {
    //Set header to JSON format(REST API)
    //res.setHeader('Content-Type', 'application/json');
    console.log('Example app listening on port 3000!');
});


process.on('SIGINT', function () {
    pool.end().then(() => {
        console.log('pool has ended');
        process.exit();
    });
});
process.on('exit', function() {
    console.log("Shutdown Node app!");

});