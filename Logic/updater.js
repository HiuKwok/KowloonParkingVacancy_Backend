/*
* Feed data into DB by API Get call from Gov src.
* */
const rp = require('request-promise');
const parser = require('./JSONStripper')

const carparkEndpoint = 'https://api.data.gov.hk/v1/carpark-info-vacancy';
const carparkInfo = carparkEndpoint + '?data=info';
const carparkVacancy =   carparkEndpoint + '?data=vacancy';
//URL class is hard to apply in this case, as only one para need to be set take String concat instead.
const carparkInfoEn = carparkInfo + "&lang=en_US";
const carparkInfoZh = carparkInfo + "&lang=zh_TW";
const carparkInfoCn = carparkInfo + "&lang=zh_CN";
//As ORM is used on this project, data would be retrieved by plain SQL
//TBC: Use query builder instead
const sqlInsertCarPark = 'INSERT INTO carpark(id, name_zh, name_cn, name_en, longitude, latitude) VALUES($1, $2, $3, $4, $5, $6) RETURNING *';
const sqlInsertVacancy = 'INSERT INTO vacancy(id, ts, available, cartype) VALUES($1, $2, $3, $4) RETURNING *';
const sqlSelectCarparkID = 'SELECT DISTINCT id FROM carpark';
const sqlSelectLatestVacancyTS = 'select id, extract(epoch  from max(ts) ) as ts from vacancy group by id;';
const sqlSelectLatestVacancySelected = 'SELECT c.name_en, c.name_zh, c.name_cn, v.id, extract(epoch FROM v.ts)  as ts FROM ( SELECT vacancy.id id , max(ts) as ts from vacancy WHERE id = $1 group by id ) v JOIN carpark c on v.id = c.id ';
const sqlSelectLatestVacancyFull = 'SELECT c.name_en, c.name_zh, c.name_cn, v.id, extract(epoch FROM v.ts)  as ts FROM ( SELECT vacancy.id id , max(ts) as ts  from vacancy group by id ) v JOIN carpark c on v.id = c.id' ;
/*
* Convert a given sql result into set.
* */
function rowsToSet (value) {

    let distinctSet = new Set();
    //Take ID only
    value.rows.forEach(v=> {
        distinctSet.add(v.id);
    })

    return distinctSet;
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
 * Perform upsert operation on table carpark, only insert when it's not exist in DB.
 * @param client
 * @param existCarpark
 * @param newcarpark
 * @returns {any[]}
 */
function gpInsert (client, existCarpark, newcarpark) {

    let insertion = new Array();
    //Insert && update
    newcarpark.forEach( item => {
        if(!existCarpark.has(item.id)) {
            const values = [item.id, item.name_zh, item.name_cn, item.name_en, item.latitude, item.longitude];
            let pro = client.query(sqlInsertCarPark, values);
            insertion.push(pro);
        }
    });
    return insertion;
}

function getInfoFromGov () {
    return new Promise ( (resolve, reject) => {

        //Issue both get call same time
        const p = rp.get(carparkInfoZh, {json:true});
        const p2 = rp.get(carparkVacancy, {json:true});

        //Wait for both call return
        Promise.all([p, p2]).then((v) => {

            let parking = parser.fetchCarparkNamePair(v[0]);
            let vacancy = parser.fetchvacancyData(v[1]);
            let re = parser.groupData(parking, vacancy);
            resolve(re);
        }, () => {reject("Fetch info fail")} );
    });
}

function getVacancyInfo (client) {
    return new Promise ( (resolve, reject) => {

        const p = client.query(sqlSelectLatestVacancyFull);
        p.then ( v => {
            v.rows.forEach( item => {
                item.ts = new Date(item.ts*1000);
            })
            resolve(v.rows);

        }, (err) => { console.log(err)});
    } );
}

function getVacancyInfoByID (client, id) {
    return new Promise ( (resolve, reject) => {

        const p = client.query(sqlSelectLatestVacancySelected, [id]);
        p.then ( v => {
            v.rows.forEach( item => {
                item.ts = new Date(item.ts*1000);
            })
            resolve(v.rows);

        }, (err) => { console.log(err)});
    } );
}


function updateCarparkInfo(client){

    return new Promise( (resolve, reject) => {
        const pZH = rp.get(carparkInfoZh, {json:true});
        const pCN = rp.get(carparkInfoCn, {json:true});
        const pEN = rp.get(carparkInfoEn, {json:true});
        const pExistRecord = client.query(sqlSelectCarparkID);

        Promise.all([pExistRecord, pZH, pCN, pEN]).then((v) => {

            //Fetch exist car-park ID from DB
            let existCarpark = rowsToSet(v[0]);
            //Fetch latest list from Gov
            let newcarpark = getCarparkInfo(v[1], v[2], v[3]);


            //Begin transaction
            client.query('BEGIN', (err) => {

                if (err) { reject('Error begin transaction') };

                //Perform upsert operation
                let insertion = gpInsert(client, existCarpark, newcarpark);

                Promise.all([...insertion]).then( () =>{
                    client.query('COMMIT', (err) => {
                        if (err) {
                            reject('Error committing transaction');
                        }else {
                            console.log("Done commit!");
                            resolve(insertion.length);
                        }
                    });

                }, () => {reject("Insertion fail")} );
            });
        }, () => {reject("Fetch info fail")} );
    });
}

function updateVacancyInfo (client){

    return new Promise ( (resolve, reject) => {

        //Fetch from Gov Endpoint
        const p2 = rp.get(carparkVacancy, {json:true});
        //Fetch existing
        const v_exist = client.query(sqlSelectLatestVacancyTS);

        Promise.all([v_exist, p2]).then((v) => {

            let exist = resultToMap(v[0]);

            client.query('BEGIN', (err) => {

                if (err) { reject('Error begin transaction')};

                let recordToIn = needToInsert(client, v[1], exist);

                Promise.all([...recordToIn]).then((v) => {

                    client.query('COMMIT', (err) => {
                        if (err) {
                            reject('Error committing transaction');
                        }else {
                            console.log("Done commit!");
                            resolve(recordToIn.length);
                        }
                    });
                }, () => {reject("Insertion fail")} );
            });
        }, () => {reject("Fetch info fail")} );
    });

}



/**
 * Group multiple parking spot info
 * @param v
 * @param name_cn
 * @param name_en
 * @returns {any[]}
 */
function getCarparkInfo (v, v_cn, v_en) {

    let name_cn = getNameMap(v_cn);
    let name_en = getNameMap(v_en);

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
    updateCarparkInfo: updateCarparkInfo,
    updateVacancyInfo: updateVacancyInfo,
    getVacancyInfo: getVacancyInfo,
    getVacancyInfoByID: getVacancyInfoByID,
    getInfoFromGov: getInfoFromGov,


//    Expose Endpoint for app.js to use atm (temparory)
    carparkVacancy: carparkVacancy,
     carparkInfoEn: carparkInfoEn,
     carparkInfoZh: carparkInfoZh,
     carparkInfoCn: carparkInfoCn,

}
