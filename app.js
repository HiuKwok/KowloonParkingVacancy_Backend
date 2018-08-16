const express = require('express');
const request = require('request');
const pg = require('pg');
const rp = require('request-promise');
const up = require('./Logic/updater');
const parser = require('./Logic/JSONStripper')
const util = require('./Logic/util')
const exUtil = require('./util/exUtil')
const config = require('./config/main')
const compression = require('compression')
const methodOverride = require('method-override')


const app = express();



//Middle ware
//Exclude those request what explicitly ask for no compression.
app.use(compression({filter: exUtil.shouldZip}));
//Any POST call in would check override field
app.use(methodOverride('X-HTTP-Method-Override'));
//POST need to be JSON format
app.use(exUtil.checkCType);
//Json
app.use(express.json());
app.use(exUtil.malformedJsonHandler);
app.use(exUtil.limiter);

const connectionString = config.connectionString;

//Establish DB pool
const pool = new pg.Pool({
    connectionString : config.connectionString,
})


app.get('/carparks', function (req, res) {
    up.getVacancyInfo(pool)
        .then( (data) => {
            exUtil.stdResponse200(res, data);
        })
        .catch(util.onRejectPrintMsg);

});


app.get('/carparks/:id', function (req, res) {
    up.getVacancyInfoByID(pool, req.params.id)
        .then( (data) => {
            if (data.length == 0 ){
                exUtil.stdResponse404(res, "Given carpark ID not exist");
            }else if (data.length == 1){
                exUtil.stdResponse200(res, data);
            } else {
                exUtil.stdResponse500(res, "DB result abnormal");
            }
        })
        .catch( (err) => {
            //TBC: Log error
            util.onRejectPrintMsg(err);
            exUtil.stdResponse500(res, "DB execution error");
        });
});

app.get('/vacancy', function (req, res) {
    up.getInfoFromGov()
        .then( (data) => { exUtil.stdResponse200(res, data);})
        .catch( (err) => {
            util.onRejectPrintMsg(err);
            exUtil.stdResponse500(res, err);
        });
});


app.post('/carparks', function (req, res) {

    console.log('request =' + JSON.stringify(req.body));
    //Perform process
    pool.connect().then(client => {
        up.updateCarparkInfo(client)
            .then( data => { exUtil.stdResponse201(res, data); })
            .catch((err) => { exUtil.stdResponse500(err);})
            .then( () => {
                console.log("Give it back anyway");
                client.release();});
    });
});

app.post('/vacancy', function (req, res) {

    pool.connect().then(client => {
        up.updateVacancyInfo(client)
        .then( data => { exUtil.stdResponse201(res, data); } )
        .catch((err) => { exUtil.stdResponse500(err); })
        .then( () => {
            console.log("Give it back anyway");
            client.release();});
    });

});


function updateVacancy () {

    const client = new pg.Client(connectionString);
    const con = client.connect();

    up.updateVacancyInfo(client)
        .then( (v)=> console.log("Insert success: ", v))
        .catch(util.onRejectPrintMsg)
        .then(() => {
            console.log("Shut down anyway");
            client.end();});

}

//Really really bad (temp setup)
 setInterval(updateVacancy, 1000*60*10);

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