/*
* Feed data into DB by API Get call from Gov src.
* */
const rp = require('request-promise');


const carparkEndpoint = 'https://api.data.gov.hk/v1/carpark-info-vacancy?data=info';
//URL class is hard to apply in this case, as only one para need to be set take String concat instead.
const carparkInfoEn = carparkEndpoint + "&lang=en_US";
const carparkInfoZh = carparkEndpoint + "&lang=zh_TW";
const carparkInfoCn = carparkEndpoint + "&lang=zh_CN";
//As ORM is used on this project, data would be retrieved by plain SQL
//TBC: Use query builder instead
const sqlInsertCarPark = 'INSERT INTO carpark(id, name_zh, name_cn, name_en, longitude, latitude) VALUES($1, $2, $3, $4, $5, $6) RETURNING *';
const sqlInsertVacancy = 'INSERT INTO vacancy(id, ts, available, cartype) VALUES($1, $2, $3, $4) RETURNING *';
const sqlSelectCarparkID = 'SELECT DISTINCT id FROM carpark';

function upcarpark (client) {

    const p = rp.get(carparkInfoEn, {json:true});
    const p2 = rp.get(carparkInfoCn, {json:true});
    const p3 = rp.get(carparkInfoZh, {json:true});
    const p_exist = client.query(sqlSelectCarparkID);

    Promise.all([p_exist, p, p2, p3]).then((v) => {
        //Exist
        let existCarpark = new Set();

        v[0].rows.forEach(v=> {
            existCarpark.add(v.id);
        })
        console.log(existCarpark);

        //New
        let name_cn = getNameMap(v[2]);
        let name_en = getNameMap(v[3]);
        let newcarpark = getCarparkInfo(v[1], name_cn, name_en);
        let insertion = gpInsert(existCarpark, newcarpark);

        return [...insertion];
    });
}

function fetchExistCarPark (client) {
    const p_exist = client.query(sqlSelectCarparkID);
}

/**
 * Receive a promise and
 */
function getNameMap (result) {
    let namePair = new Map();
    result.results.forEach( v => {
        namePair.set(v.park_Id, v.name);
    });
    return namePair;
}


/**
 * Group multiple parking spot info
 * @param v
 * @param name_cn
 * @param name_en
 * @returns {any[]}
 */
function getCarparkInfo (v, name_cn, name_en) {
    let newcarpark = new Array();
    let r = v.results;
    r.forEach( record => {
        let i =  {
            id : record.park_Id,
            name_zh : record.name,
            name_cn : name_cn.get(record.park_Id),
            name_en : name_en.get(record.park_Id),
            latitude : record.latitude,
            longitude : record.longitude
        };
        newcarpark.push(i);
    })
    return newcarpark;
}

/**
 * Only add when exist map not found
 */
function gpInsert (client, existCarpark, newcarpark) {

    let insertion = new Array();
    //Insert && update
    for (let i=0 ; i<newcarpark.length ; i++){
        let item = newcarpark[i];
        if(!existCarpark.has(item.id)) {
            const values = [item.id, item.name_zh, item.name_cn, item.name_en, item.latitude, item.longitude];
            let pro = client.query(sqlInsertCarPark, values);
            insertion.push(pro);
        }
    }
    return insertion;
}



function resultToMap(r) {
    let exist = new Map();
    r.rows.forEach( v => {
        exist.set(v.id, v.ts);

    });
    return exist;
}


function needToInsert (client, r, exist) {

    let insertion = new Array();
    r.results.forEach( i => {
        const values = [i.park_Id,  new Date(i.privateCar[0].lastupdate), i.privateCar[0].vacancy, "privateCar"];

        //HKG == +8?
        let offSet = (-1) * new Date().getTimezoneOffset() * 60000;
        let tsInMs = (new Date(i.privateCar[0].lastupdate).getTime() + offSet) /1000;

        //Only insert when not match
        if (!exist.has(i.park_Id) || (exist.has(i.park_Id) && tsInMs != exist.get(i.park_Id) ) ){
            console.log("Insert new vacancy record on [", i.park_Id, "]",  exist.get(i.park_Id), " -> ",  tsInMs);
           let pro = client.query(sqlInsertVacancy, values);
           insertion.push(pro);
        }
    });
    return insertion;
}


module.exports = {
    upcarpark: upcarpark,
    getNameMap: getNameMap,
    getCarparkInfo: getCarparkInfo,
    gpInsert: gpInsert,
    resultToMap: resultToMap,
    needToInsert: needToInsert
}
