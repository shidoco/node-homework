const Joi = require("joi");

const passwordComplexity = require('joi-password-complexity');

const complexityOptions = {
    min: 8,
    max: 30,
    lowerCase: 1,
    upperCase: 1,
    numeric: 1,
    symbol: 1,
    requirementCount: 4,
}

const userSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(), 
  name: Joi.string().trim().min(3).max(30).required(),
  password: passwordComplexity(complexityOptions).required(),
});

module.exports = { userSchema };