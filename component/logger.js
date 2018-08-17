const winston = require('winston');
const {transports, createLogger, format} = require('winston');


/*
* Custom logger vacancy project
* */

let logger = winston.createLogger({
    format: format.combine(
        format.timestamp(),
        format.cli()
    ),
    transports: [
        new (winston.transports.Console)({'timestamp':true})
    ]
});


module.exports = logger;