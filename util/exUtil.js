/*
* Contain all util method which related to express.js, stuff like template response and such
* */
const compression = require('compression')

function stdResponse500 (res, r) {
    res.status(500);
    res.json({reason: r});
}

function stdResponse201 (res, r) {
    //TBC: Set new location on header
    res.status(201);
    res.json({result: r});
}


function stdResponse404 (res, r) {
    res.status(404);
    res.json({reason: r});
}

function stdResponse200 (res, content) {
    res.setHeader('Content-Type', 'application/json');
    res.status(200);
    res.end(JSON.stringify(content) );
}

//Custom middle ware
function checkCType (req, res, next) {
    if (!req.is('application/json') && req.method == 'POST') {
        res.status(415);
        res.end();
    } else {
        return next();
    }
}

//Exclude those who ask for not
function shouldZip (req, res) {
    if (req.headers['x-no-compression']) {
        return false;
    }
    // fallback to standard filter function
    return compression.filter(req, res);
}



module.exports = {
    stdResponse201: stdResponse201,
    stdResponse404: stdResponse404,
    stdResponse200: stdResponse200,
    stdResponse500: stdResponse500,
    checkCType: checkCType,
    shouldZip: shouldZip
}