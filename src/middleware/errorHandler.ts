import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handling middleware
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new CustomError(message, 404);
  }

  // Mongoose duplicate key
  if (err.name === 'MongoError' && (err as any).code === 11000) {
    const message = 'Duplicate field value entered';
    error = new CustomError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message).join(', ');
    error = new CustomError(message, 400);
  }

  // PostgreSQL unique violation
  if (err.name === 'error' && (err as any).code === '23505') {
    const message = 'Duplicate entry';
    error = new CustomError(message, 409);
  }

  // PostgreSQL foreign key violation
  if (err.name === 'error' && (err as any).code === '23503') {
    const message = 'Referenced resource not found';
    error = new CustomError(message, 400);
  }

  // Axios errors (for scraping)
  if (err.message.includes('Request failed') || err.message.includes('timeout')) {
    error = new CustomError('External service unavailable', 503);
  }

  // Prepare response based on environment
  const response: any = {
    success: false,
    error: error.message || 'Server Error'
  };

  // Only include stack trace in development
  if (config.nodeEnv === 'development') {
    response.stack = err.stack;
  }

  res.status(error.statusCode || 500).json(response);
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new CustomError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};
