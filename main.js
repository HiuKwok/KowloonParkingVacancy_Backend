
const fs = require('fs');
const request = require('request');
const rp = require('request-promise');
const parser = require('./Logic/JSONStripper')

function logMapElements(value, key, map) {
    console.log(`m[${key}] = ${value}`);
}


// let jsonStr = fs.readFileSync('./data/carparkinfo.json', 'utf8');
// let vacancyDataStr = fs.readFileSync('./data/vacancy.json', 'utf8');
// let data = JSON.parse(jsonStr);
// let vancacyJson = JSON.parse(vacancyDataStr);
//
// let parkingmap = parser.fetchCarparkNamePair(data);
// let result = parser.fetchvacancyData(vancacyJson);
// let re = parser.groupData(parkingmap, result);
//
// for (var i = 0; i < re.length; i++) {
//    console.log(re[i]);
// }

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
    console.log(re);
})

