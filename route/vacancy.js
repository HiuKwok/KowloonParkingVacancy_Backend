
const express = require('express');
const db = require('../component/dbPool');
const exUtil = require('../util/exUtil');
const up = require('../Logic/updater');
const util = require('../Logic/util')

const router = express.Router();



router.get('/', function (req, res) {
    up.getInfoFromGov()
        .then( (data) => { exUtil.stdResponse200(res, data);})
        .catch( (err) => {
            util.onRejectPrintMsg(err);
            exUtil.stdResponse500(res, err);
        });
});




router.post('/', function (req, res) {

    db.pool.connect().then(client => {
        up.updateVacancyInfo(client)
            .then( data => { exUtil.stdResponse201(res, data); } )
            .catch((err) => { exUtil.stdResponse500(err); })
            .then( () => {
                console.log("Give it back anyway");
                client.release();});
    });

});

module.exports = router;