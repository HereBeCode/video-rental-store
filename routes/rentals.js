const auth = require('../middleware/auth')
const mongoose = require('mongoose')
const express = require('express')
const router = express.Router()
const { Rental, validateRental } = require('../models/rental')
const { Customer } = require('../models/customer')
const { Movie } = require('../models/movie')

router.get('/', async (req, res) => {
    const rental = await Rental.find().populate('customer movie')
    res.send(rental)
})

router.get('/:id', async (req, res) => {
    const rental = await Rental.findById(req.params.id).populate('customer movie')
    if (!rental) return res.status(404).send(`Rental with id: ${req.params.id} not found.`)
    res.send(rental);
})

router.post('/', auth, async (req, res) => {
    const { error } = validateRental(req.body)
    if (error) return res.status(400).send(error.message)

    const customer = await Customer.findById(req.body.customerId)
    if (!customer) return res.status(400).send(`Customer with id: ${req.body.customerId} not found.`)

    let movie = await Movie.findById(req.body.movieId)
    if (!movie) return res.status(400).send(`Movie with id: ${req.body.movieId} not found.`)

    if(movie.numberInStock == 0) return res.status(400).send("Movie not in stock.")

    const rental = new Rental({
        movie: movie._id,
        customer: customer._id
    })

    async function addRental() {
        const session = await mongoose.startSession()
        session.startTransaction();
        try {
            await rental.save( { session } );
            await movie.updateOne( { $inc: { numberInStock: -1 } }, { session } );
            await session.commitTransaction();
            session.endSession();
            console.log('Success')
            res.send(rental)
        }
        catch (e) {
            await session.abortTransaction();
            session.endSession();
            console.log('error111', e.message);
        }
    }
    addRental();
})
module.exports = router