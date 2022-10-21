const auth = require('../middleware/auth')
const admin = require('../middleware/admin')
const { Movie, validate } = require('../models/movie')
const { Genre } = require('../models/genre')
const mongoose = require('mongoose')
const express = require('express')
const router = express.Router();

router.get('/', async (req, res) => {
    const movie = await Movie.find().sort('title')
    res.send(movie);
})

router.get('/:id', async (req, res) => {
    const movie = await Movie.findById(req.params.id)
    if (!movie) return res.status(404).send(`Movie with id: ${req.params.id} not found (invalid id).`)
    res.send(movie)
})

router.post('/', auth, async (req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.message)

    const genre = await Genre.findById(req.body.genreId)
    if (!genre) return res.status(404).send(`Genre with id: ${req.body.genreId} not found.`);

    const movie = new Movie({
        title: req.body.title,
        genre: {
            _id: genre._id,
            name: genre.name
        },
        numberInStock: req.body.numberInStock,
        dailyRentalRate: req.body.dailyRentalRate 
    });

    await movie.save();
    res.send(movie);
})

router.put('/:id', auth, async (req, res) => {
    const { error } = validate(req.body)
    if (error) return res.status(400).send(error.message)

    const genre = await Genre.findById(req.body.genreId)
    if (!genre) return res.status(404).send(`Genre with id: ${req.body.genreId} not found.`)
    
    const movie = await Movie.findByIdAndUpdate(req.params.id, {
        title: req.body.title,
        genre: {
            _id: genre._id,
            name: genre.name
        },
        numberInStock: req.body.numberInStock,
        dailyRentalRate: req.body.dailyRentalRate
    }, {new: true})

    if (!movie) return res.status(404).send(`Movie with id: ${req.params.id} not found.`)
    res.send(movie)
})

router.delete('/:id', [auth, admin], async (req, res) => {
    const movie = await Movie.findByIdAndDelete(req.params.id)
    if (!movie) return res.status(404).send(`Movie with id: ${req.params.id} not found.`)
    res.send(`Movie with id: ${req.params.id} removed successfully`)
})


module.exports = router;