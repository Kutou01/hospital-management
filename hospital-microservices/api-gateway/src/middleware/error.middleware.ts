import { Request, Response, NextFunction } from 'express';
import logger from '@hospital/shared/src/utils/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('API Gateway Error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    headers: req.headers,
    query: req.query
  });

  res.status(500).json({
    success: false,
    error: 'API Gateway Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : error.message,
    timestamp: new Date().toISOString()
  });
};
