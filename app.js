const express = require('express');
const request = require('request');
const pg = require('pg');
const rp = require('request-promise');
const up = require('./Logic/updater');
const parser = require('./Logic/JSONStripper')
const util = require('./Logic/util')
const config = require('./config/main')
var app = express();
let limitCount = 10;

const connectionString = config.connectionString;

const sqlSelectLatestVacancyFull = 'SELECT c.name_en, c.name_zh, c.name_cn, extract(epoch FROM MAX(v.ts) ) FROM vacancy v JOIN carpark c on v.id = c.id GROUP BY c.id, c.name_en, c.name_zh, c.name_cn ';

app.get('/carparks', function (req, res) {

    //Only resolve request when limitCount >0
    if (limitCount > 0) {
        //Decrement no matter ajax success or not
        limitCount--;

        res.setHeader('Content-Type', 'application/json');

        //Issue both get call same time
        const p = rp.get(up.carparkInfoZh, {json:true});
        const p2 = rp.get(up.carparkVacancy, {json:true});

        //Wait for both call return
        Promise.all([p, p2]).then((v) => {

            let parking = parser.fetchCarparkNamePair(v[0]);
            let vacancy = parser.fetchvacancyData(v[1]);
            let re = parser.groupData(parking, vacancy);
            //Sd to response.
            res.end(JSON.stringify(re) );
            console.log(re);
        })

    }else {
        res.status(403);
        res.end();
    }

});



app.get('/vacancy', function (req, res) {
    const client = new pg.Client(connectionString);
    client.connect();


    up.getVacancyInfo(client)
        .then( (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data) );
        })
        .catch(util.onRejectPrintMsg)
        .then(() => { client.end();});
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