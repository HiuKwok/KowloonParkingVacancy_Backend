const express = require('express');
const request = require('request');
const rp = require('request-promise');
const parser = require('./Logic/JSONStripper')
var app = express();
let limitCount = 10;




app.get('/carparks', function (req, res) {

    //Only resolve request when limitCount >0
    if (limitCount > 0) {
        //Decrement no matter ajax success or not
        limitCount--;

        res.setHeader('Content-Type', 'application/json');
        let url_carpark_name = 'https://api.data.gov.hk/v1/carpark-info-vacancy?data=info&lang=zh_TW&vehicleTypes=privateCar';
        let url_carpark_vancay = 'https://api.data.gov.hk/v1/carpark-info-vacancy?data=vacancy&lang=zh_TW&vehicleTypes=privateCar';

        //Issue both get call same time
        const p = rp.get(url_carpark_name, {json:true});
        const p2 = rp.get(url_carpark_vancay, {json:true});

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





app.listen(3000, function (req, res) {
    //Set header to JSON format(REST API)
    //res.setHeader('Content-Type', 'application/json');
    console.log('Example app listening on port 3000!');
});