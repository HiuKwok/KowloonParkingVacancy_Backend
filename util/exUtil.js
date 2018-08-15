/*
* Contain all util method which related to express.js, stuff like template response and such
* */

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



module.exports = {
    stdResponse201: stdResponse201,
    stdResponse404: stdResponse404,
    stdResponse200: stdResponse200,
    stdResponse500: stdResponse500
}