const pg = require('pg');
const config = require('../config/main')
/*
* Encapsulate all the detail about DB connection and only expose one single entry
* */


//Establish DB pool
let pool;

//Singleton implementation?
function initDB () {
   if (!this.pool){
       console.log("New Pool");
       this.pool = new pg.Pool({
           connectionString : config.connectionString,
       })
   }
   return this.pool;
}



function shutDB () {
    return new Promise ( (resolve, reject) => {

        if (!this.pool){
            reject("DB pool is not even on yet -> No action taken!");
        }else {
            pool.end()
                .then((data) => { resolve(data) } )
                .catch((err) => { reject(err)});
        };
    });
};

module.exports = {
    initDB: initDB,
    shutDB: shutDB,
    pool: pool
}
