const Joi = require('joi')
const mongoose = require('mongoose')
const lateFee = 25;

const rentalSchema = new mongoose.Schema({
    movie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    rentalStartDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    returnByDate: {
        type: Date,
        default: () => Date.now() + 7*24*60*60*1000,
        required: true
    },
    dateReturned: {
        type: Date
    },
    rentalFee: {
        type: Number,
        min: 0
    }
})

rentalSchema.statics.lookup = function(customerId, movieId) {
    return this.findOne( { customerId, movieId })
}

rentalSchema.methods.setRentalFee = function(movie) {
    this.dateReturned = new Date();

    const rentalFee = movie.dailyRentalRate * ((this.dateReturned - this.rentalStartDate) / (1000 * 60 * 60 * 24))
    if (this.dateReturned > this.returnByDate) {
        this.rentalFee = rentalFee + lateFee
    }
    else this.rentalFee = rentalFee;
}

const Rental = mongoose.model('Rental', rentalSchema)

function validateRental(rental) {
    const schema = Joi.object({
        movieId: Joi.string().hex().length(24).required(),
        customerId: Joi.string().hex().length(24).required(),
    })
    return schema.validate(rental)
}

module.exports.Rental = Rental
module.exports.validateRental = validateRental
module.exports.lateFee = lateFee;