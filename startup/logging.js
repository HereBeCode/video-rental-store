const logger = require('../logger')

module.exports = function() {
    require('express-async-errors')
    process.on('uncaughtException', (ex) => {
        console.log('Uncaught exception handled.')
        logger.error(ex.message, ex);
        process.exit(1);
    })
}