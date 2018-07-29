const express = require('express');
const request = require('request');
const parser = require('./Logic/JSONStripper')
var app = express();





app.get('/carparks', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    let url_carpark_name = 'https://api.data.gov.hk/v1/carpark-info-vacancy?data=info&lang=zh_TW&vehicleTypes=privateCar';
    let url_carpark_vancay = 'https://api.data.gov.hk/v1/carpark-info-vacancy?data=vacancy&lang=zh_TW&vehicleTypes=privateCar';

    request.get(url_carpark_name, {json:true}, (err, _, body) => {
        //Reformat
        let parkingmap = parser.fetchCarparkNamePair(body);

        console.log(parkingmap);

        request.get( url_carpark_vancay, {json:true}, (err, _, body) => {
            let vacancy = parser.fetchvacancyData(body);
            console.log(body);
            let re = parser.groupData(parkingmap, vacancy);
            //Sd to response.
            res.end(JSON.stringify(re) );
        });
    });
});





app.listen(3000, function (req, res) {
    //Set header to JSON format(REST API)
    //res.setHeader('Content-Type', 'application/json');
    console.log('Example app listening on port 3000!');
});