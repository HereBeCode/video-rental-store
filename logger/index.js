const winston = require('winston')
require('winston-mongodb')

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        // - Write all logs with importance of 'error' or less to 'error.log'
        // - Write all logs with importance of 'info' or less to the 'combined.log'
        new winston.transports.File({ filename: './logger/error.log', level: 'error' }),
        new winston.transports.File({ filename: './logger/combined.log' }),
        new winston.transports.MongoDB({ db: 'mongodb://localhost/vidly', options: { useUnifiedTopology: true }})
        
    ]
})

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }))
}

module.exports = logger