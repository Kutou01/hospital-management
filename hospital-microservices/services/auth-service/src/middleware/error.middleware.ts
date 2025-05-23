import { Request, Response, NextFunction } from 'express';
import { 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError, 
  ConflictError 
} from '@hospital/shared/src/types/common.types';
import logger from '@hospital/shared/src/utils/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });

  // Validation Error
  if (error instanceof ValidationError) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.message,
      field: error.field,
      value: error.value
    });
    return;
  }

  // Not Found Error
  if (error instanceof NotFoundError) {
    res.status(404).json({
      success: false,
      error: 'Not Found',
      message: error.message
    });
    return;
  }

  // Unauthorized Error
  if (error instanceof UnauthorizedError) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: error.message
    });
    return;
  }

  // Forbidden Error
  if (error instanceof ForbiddenError) {
    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: error.message
    });
    return;
  }

  // Conflict Error
  if (error instanceof ConflictError) {
    res.status(409).json({
      success: false,
      error: 'Conflict',
      message: error.message
    });
    return;
  }

  // Database/Supabase specific errors
  if (error.message.includes('duplicate key value')) {
    res.status(409).json({
      success: false,
      error: 'Conflict',
      message: 'Resource already exists'
    });
    return;
  }

  if (error.message.includes('foreign key constraint')) {
    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Invalid reference to related resource'
    });
    return;
  }

  // Default Internal Server Error
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : error.message
  });
};
