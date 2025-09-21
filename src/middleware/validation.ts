import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Validation schemas
export const createShortUrlSchema = Joi.object({
  original_url: Joi.string().uri().required().messages({
    'string.uri': 'Please provide a valid URL',
    'any.required': 'Original URL is required'
  }),
  expires_at: Joi.string().isoDate().optional().messages({
    'string.isoDate': 'Please provide a valid ISO date string'
  })
});

export const shortCodeSchema = Joi.object({
  shortCode: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).min(4).max(10).required().messages({
    'string.pattern.base': 'Short code must contain only alphanumeric characters, hyphens, and underscores',
    'string.min': 'Short code must be at least 4 characters long',
    'string.max': 'Short code must be at most 10 characters long',
    'any.required': 'Short code is required'
  })
});

export const paginationSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(50).optional(),
  offset: Joi.number().integer().min(0).default(0).optional()
});

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema, property: 'body' | 'params' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = req[property];
    const { error, value } = schema.validate(data, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      res.status(400).json({
        error: 'Validation failed',
        details: errorMessages
      });
      return;
    }

    // Replace the original data with validated and sanitized data
    req[property] = value;
    next();
  };
};

// Custom validation middleware for URL shortening
export const validateCreateShortUrl = validate(createShortUrlSchema, 'body');
export const validateShortCode = validate(shortCodeSchema, 'params');
export const validatePagination = validate(paginationSchema, 'query');
