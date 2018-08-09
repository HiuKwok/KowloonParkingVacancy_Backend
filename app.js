const express = require('express');
const request = require('request');
const pg = require('pg');
const rp = require('request-promise');
const up = require('./Logic/updater');
const parser = require('./Logic/JSONStripper')
const config = require('./config/main')
var app = express();
let limitCount = 10;

const connectionString = config.connectionString;

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

app.post('/carparks', function (req, res) {

    const client = new pg.Client(connectionString);
    client.connect();

    const p = rp.get(up.carparkInfoZh, {json:true});
    const p2 = rp.get(up.carparkInfoCn, {json:true});
    const p3 = rp.get(up.carparkInfoEn, {json:true});
    const p_exist = client.query(up.sqlSelectCarparkID);

    Promise.all([p_exist, p, p2, p3]).then((v) => {
        //Exist
        let existCarpark = new Set();

        v[0].rows.forEach(v=> {
            existCarpark.add(v.id);
        })
        console.log(existCarpark);

        //New
        let name_cn = up.getNameMap(v[2]);
        let name_en = up.getNameMap(v[3]);
        let newcarpark = up.getCarparkInfo(v[1], name_cn, name_en);
        let insertion = up.gpInsert(client, existCarpark, newcarpark);

        Promise.all([...insertion]).then( () =>{
            //console.log("Insertion size:" + insertion.length)
            //All promise done
            client.end();
        }, () => {client.end();} );
    });
    res.status(200);
    res.end();
});


app.post('/vacancy', function (req, res) {
    const client = new pg.Client(connectionString);
    const con = client.connect();

    const p2 = rp.get(up.carparkVacancy, {json:true});

    con.then( () => {
        console.log("Hello connect");
        //Fetch existing
        const v_exist = client.query(up.sqlSelectLatestVacancyTS);

        Promise.all([v_exist, p2]).then((v) => {
            let exist = up.resultToMap(v[0]);
            console.log(exist);
            let recordToIn = up.needToInsert(client, v[1], exist);
            console.log(recordToIn);
            Promise.all([...recordToIn]).then((v) => {
                console.log("Insertion size: ", recordToIn.length);
                client.end();
            }, () => {client.end();});
        }, () => {client.end();} );

    });
    res.status(200);
    res.end();
});


function updateVacancy () {

    const client = new pg.Client(connectionString);
    const con = client.connect();

    const p2 = rp.get(up.carparkVacancy, {json:true});

    con.then( () => {
        console.log("Hello connect");
        //Fetch existing
        const v_exist = client.query(up.sqlSelectLatestVacancyTS);

        Promise.all([v_exist, p2]).then((v) => {
            let exist = up.resultToMap(v[0]);
            let recordToIn = up.needToInsert(client, v[1], exist);
            Promise.all([...recordToIn]).then((v) => {
                console.log("Insertion size: ", recordToIn.length);
                client.end();
            });
        }, () => {client.end();}  );

    });
}

//Really really bad (temp setup)
setInterval(updateVacancy, 1000*60*5);


app.listen(3000, function (req, res) {
    //Set header to JSON format(REST API)
    //res.setHeader('Content-Type', 'application/json');
    console.log('Example app listening on port 3000!');
});