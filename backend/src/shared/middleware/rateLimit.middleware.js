const rateLimit = require('express-rate-limit');
const { AppError } = require('./errorHandler');

/**
 * Standard API rate limiting.
 * Defaults to 100 requests per 15 minutes per IP.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next) => {
    next(new AppError('Too many requests, please try again in 15 minutes.', 429));
  },
});

/**
 * Stricter limiter for authentication/sensitive routes.
 * 20 requests per hour for login/register for same IP.
 */
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  handler: (req, res, next) => {
    next(new AppError('Account reach rate limit. Please wait an hour.', 429));
  },
});

module.exports = { apiLimiter, authLimiter };
