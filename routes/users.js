const auth = require('../middleware/auth')
const bcrypt = require('bcrypt')
const _ = require('lodash')
const { User, validate } = require('../models/user')
const mongoose = require('mongoose')
const express = require('express')
const router = express.Router()

router.get('/me', auth, async (req, res) => {
    const user = await User.findById(req.user._id).select('-password')
    res.send(user)
})

router.post('/', async (req, res) => {
    setTimeout(async () => {
        const { error } = validate(req.body);
        if (error) return res.status(400).send(error.message)
    
        const existing_email = await User.findOne( { email: req.body.email });
        if (existing_email) return res.status(400).send('Could not create user.') 
        
        const existing_username = await User.findOne( { username: req.body.username });
        if (existing_username) return res.status(400).send('Could not create user.')
        
        const salt = await bcrypt.genSalt(10)
        const hashed_password = await bcrypt.hash(req.body.password, salt)

        const user = new User({
            username: req.body.username,
            birth_year: req.body.birth_year,
            email: req.body.email,
            password: hashed_password
        })
        await user.save();
        const token = user.generateAuthToken();
        res.header('x-auth-token', token).send({
            _id: user._id,
            username: user.username,
            email: user.email
        })
    }, 5000)
})

module.exports = router