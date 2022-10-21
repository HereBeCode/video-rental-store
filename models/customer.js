const Joi = require('joi');
const mongoose = require('mongoose');

const Customer = mongoose.model('Customer', new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 80,
    },
    phone: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 11,
    },
    isGold: {
        type: Boolean,
        default: false
    }
}));

function validateCustomer(customer) {
    const schema = Joi.object({
        name: Joi
                .string()
                .required()
                .min(1)
                .max(80),
        phone: Joi
                .string()
                .required()
                .min(10)
                .max(11),
        isGold: Joi
                .boolean()
    })
    return schema.validate(customer);
}

module.exports.Customer = Customer;
module.exports.validate = validateCustomer;