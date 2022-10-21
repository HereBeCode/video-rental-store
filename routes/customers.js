const auth = require('../middleware/auth')
const admin = require('../middleware/admin')
const { Customer, validate } = require('../models/customer');
const mongoose = require('mongoose')
const express = require('express')
const router = express.Router();

router.get('/', async (req, res) => {
    const customers = await Customer.find().sort('name');
    res.send(customers)
})

router.get('/:id', async (req, res) => {
    const customer = await Customer.find(req.params.id)
    if (!customer) return res.status(404).send(`Customer with id: ${req.params.id} does not exist.`)
    res.send(customer)
})

router.post('/', async (req, res) => {
    const { error } = validate(req.body)
    if (error) return res.status(400).send(error.message);
    const customer = new Customer({
        name: req.body.name,
        phone: req.body.phone,
        isGold: req.body.isGold
    })
    await customer.save();
    res.send(customer);
})

router.put('/:id', [auth, admin], async (req, res) => {
    const { error } = validate(req.body)
    if (error) return res.status(400).send(error.message)
    
    const customer = await Customer.findByIdAndUpdate(req.params.id, { name: req.body.name, phone: req.body.phone, isGold: req.body.isGold})
    
    if (!customer) return res.status(404).send(`Genre with name ${req.params.name} not found.`);
    res.send(customer);
})

router.delete('/:id', [auth, admin], async (req, res) => {
    const customer = await Customer.findByIdAndRemove(req.params.id)
    if (!customer) res.status(404).send(`Customer with id: ${req.params.id} does not exist.`)

    res.send(`Customer: ${req.params.id} removed`)
})
module.exports = router;