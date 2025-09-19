const Joi = require('joi');

/**
 * Middleware to validate request body using Joi schema
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Show all validation errors
      stripUnknown: true, // Remove unknown fields
      convert: true // Convert types (e.g., string to number)
    });

    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        error: {
          message: 'Validation failed',
          details: errorMessages
        }
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
}

/**
 * Validation schemas
 */
const schemas = {
  // Schema for creating a short URL
  createUrl: Joi.object({
    originalUrl: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .required()
      .messages({
        'string.uri': 'Please provide a valid URL',
        'any.required': 'URL is required'
      }),
    customCode: Joi.string()
      .alphanum()
      .min(3)
      .max(20)
      .optional()
      .messages({
        'string.alphanum': 'Custom code must contain only letters and numbers',
        'string.min': 'Custom code must be at least 3 characters long',
        'string.max': 'Custom code must be at most 20 characters long'
      }),
    expiryDays: Joi.number()
      .integer()
      .min(1)
      .max(365)
      .optional()
      .messages({
        'number.min': 'Expiry days must be at least 1',
        'number.max': 'Expiry days cannot exceed 365'
      })
  }),

  // Schema for getting analytics
  getAnalytics: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    limit: Joi.number().integer().min(1).max(100).optional().default(50)
  })
};

module.exports = {
  validateRequest,
  schemas
};
