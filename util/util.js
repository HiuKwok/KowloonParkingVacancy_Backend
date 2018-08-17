/*
* All util method.
*
* */
const moment = require('moment')

const fmtStr = "YYYY-MM-DD HH:mm:ss";


/*
* TBC:
*  - Not a good practice as some region timezone would shift like Au.
*  - Server should always store time in UTC matter
* */
function toHktTs (date){
    return ut = moment(date, fmtStr).unix()+28800;
}


function onRejectPrintMsg (err) {
    console.log("Error occurred: ", err);
}

module.exports = {
    onRejectPrintMsg: onRejectPrintMsg,
    toHktTs: toHktTs
}