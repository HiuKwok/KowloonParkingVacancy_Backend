
const fs = require('fs');
const parser = require('./Logic/JSONStripper')

function logMapElements(value, key, map) {
    console.log(`m[${key}] = ${value}`);
}




let jsonStr = fs.readFileSync('./data/carparkinfo.json', 'utf8');
let vacancyDataStr = fs.readFileSync('./data/vacancy.json', 'utf8');
let data = JSON.parse(jsonStr).results;
let vancacyJson = JSON.parse(vacancyDataStr).results;

let parkingmap = parser.fetchCarparkNamePair(data);
let result = parser.fetchvacancyData(vancacyJson);
let re = parser.groupData(parkingmap, result);

for (var i = 0; i < re.length; i++) {
   console.log(re[i]);
}

