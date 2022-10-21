const validateObjectId = require('../middleware/validateObjectId')
const admin = require('../middleware/admin')
const auth = require('../middleware/auth')
const { Genre, validate } = require('../models/genre')
const mongoose = require('mongoose')
const express = require('express');
const router = express.Router();

router.get('/', async (req,res) => {
    const genres = await Genre.find().sort('name');
    res.send(genres);
})

router.get('/:id', validateObjectId, async (req, res) => {    
    const genre = await Genre.findById(req.params.id);
    if(!genre) return res.status(404).send('The genre requested does not exist.');
    
    res.send(genre)
})

router.post('/', auth, async (req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.message);

    const genre = new Genre({ name: req.body.name });
    await genre.save();
    res.send(genre);
})

router.put('/:id', [auth, validateObjectId] , async (req,res) => {
    const { error } = validate(req.body)
    if (error) return res.status(400).send(error.message);

    const genre = await Genre.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true })
    if (!genre) return res.status(404).send(`Genre with id ${req.params.id} not found.`);
    
    res.send(genre);
})

router.delete('/:id', [auth, admin, validateObjectId], async (req, res) => {
    const genre = await Genre.findByIdAndRemove(req.params.id);
    
    if (!genre) return res.status(404).send(`Genre with id ${req.params.id} not found`);

    res.send(genre)
})

module.exports = router;