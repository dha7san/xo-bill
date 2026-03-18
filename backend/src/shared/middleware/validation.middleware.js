const Joi = require('joi');
const { AppError } = require('./errorHandler');

/**
 * Generic Joi validation middleware.
 * Validates request body, query or params against a schema.
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map(d => d.message).join(', ');
      return next(new AppError(`Validation Input Error: ${message}`, 400));
    }

    // Replace original property with validated/stripped value
    req[property] = value;
    next();
  };
};

module.exports = { validate };
