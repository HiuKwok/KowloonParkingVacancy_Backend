/*
* Router for all route which under /carparks
* */


const express = require('express');
const db = require('../component/dbPool');
const exUtil = require('../util/exUtil');
const up = require('../Logic/updater');
const util = require('../Logic/util')

const router = express.Router();



router.get('/',  function (req, res) {
    up.getVacancyInfo(db.pool)
        .then( (data) => {
            exUtil.stdResponse200(res, data);
        })
        .catch(util.onRejectPrintMsg);

});


router.get('/:id', function (req, res) {
    up.getVacancyInfoByID(db.pool, req.params.id)
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

router.post('/', function (req, res) {

    //Perform process
    db.pool.connect().then(client => {
        up.updateCarparkInfo(client)
            .then( data => { exUtil.stdResponse201(res, data); })
            .catch(exUtil.stdResponse500)
            .then( () => { client.release();});
    });
});


module.exports = router;