const {Rental, lateFee, validateRental} = require('../models/rental')
const express = require('express');
const auth = require('../middleware/auth');
const { Movie } = require('../models/movie');
const validate = require('../middleware/validate')
const router = express.Router();

router.post('/', [auth, validate(validateRental)], async (req,res) => {
    const rental = await Rental.lookup(req.body.customerId, req.body.movieId)
    const movie = await Movie.findOne({
        _id: req.body.movieId
    })

    if(!rental) return res.status(404).send('rental not found')

    if(rental.dateReturned) return res.status(400).send('Rental already processed')

    rental.setRentalFee(movie);
    await rental.save();

    movie.numberInStock++;
    await movie.save();

    return res.send(rental);
})

module.exports = router;