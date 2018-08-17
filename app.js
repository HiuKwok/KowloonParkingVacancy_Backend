const express = require('express');
const request = require('request');
const rp = require('request-promise');
const up = require('./Logic/updater');
const parser = require('./Logic/JSONStripper')
const util = require('./Logic/util')
const config = require('./config/main')
const compression = require('compression')
const methodOverride = require('method-override')
const helmet = require('helmet')
const morgan = require('morgan')
const dbPool = require('./component/dbPool');
const exUtil = require('./util/exUtil');
const carparks = require('./route/carparks');
const vacancy = require('./route/vacancy');
const db = require('./component/dbPool');
const app = express();



//Middle ware

//Log first no matter what status
app.use(morgan('combined'))

app.use(helmet())

//Exclude those request what explicitly ask for no compression.
app.use(compression({filter: exUtil.shouldZip}));

//Any POST call in would check override field
app.use(methodOverride('X-HTTP-Method-Override'));

//POST need to be JSON format
app.use(exUtil.checkCType);
//Json
app.use(express.json());
app.use(exUtil.malformedJsonHandler);

//Rate limiter
app.use(exUtil.limiter);

//Establish DB pool
const pool = dbPool.initDB();

//Route
app.use('/carparks', carparks);
app.use('/vacancy', vacancy);


//Really really bad (temp setup)
 setInterval( () => {
     db.pool.connect().then(client => {
         up.updateVacancyInfo(client)
             .then( () => {
                 console.log("Give it back anyway");
                 client.release();});
     });
 }, 1000*5);

app.listen(3000, function (req, res) {
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