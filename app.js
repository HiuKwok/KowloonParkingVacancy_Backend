const express = require('express');

//Middleware
const compression = require('compression')
const methodOverride = require('method-override')
const helmet = require('helmet')
const morgan = require('morgan')


//Route
const carparks = require('./route/carparks');
const vacancy = require('./route/vacancy');

//Config
const config = require('./config/main')
//Custom module
const up = require('./Logic/updater');
const exUtil = require('./util/exUtil');
const dbPool = require('./component/dbPool');



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
     pool.connect().then(client => {
         up.updateVacancyInfo(client)
             .then(client.release);
     });
 }, 1000*50);

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