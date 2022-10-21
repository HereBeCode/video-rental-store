const config = require('config')
const jwt = require('jsonwebtoken')
const Joi = require('joi')
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 1,
        maxlength: 255
    },
    birth_year: {
        type: Number,
        required: true,
        min: 1900,
        max: new Date().getFullYear()
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 1024
    },
    isAdmin: {
        type: Boolean
    }
})

userSchema.methods.generateAuthToken = function() {
    const token = jwt.sign({ _id: this._id, isAdmin: this.isAdmin }, config.get('jwtPrivateKey'))
    return token;
}

const User = mongoose.model('User', userSchema)

function validateUser(user) {
    const schema = Joi.object({
        username: Joi.string().min(1).max(255).required(),
        email: Joi.string().required().email(),
        password: Joi.string().min(8).max(1024).required(),
        repeat_password: Joi.ref('password'),
        birth_year: Joi.number().integer().min(1900).max(new Date().getFullYear()).required()
    })
    return schema.validate(user)
}


module.exports.validate = validateUser;
module.exports.User = User