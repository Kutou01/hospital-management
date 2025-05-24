"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
// Simple error classes
class ValidationError extends Error {
    constructor(message, field, value) {
        super(message);
        this.field = field;
        this.value = value;
        this.name = 'ValidationError';
    }
}
class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
    }
}
class UnauthorizedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UnauthorizedError';
    }
}
class ForbiddenError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ForbiddenError';
    }
}
class ConflictError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConflictError';
    }
}
// Simple logger
const logger = {
    error: (message, data) => {
        console.error(`[ERROR] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
};
const errorHandler = (error, req, res, next) => {
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
exports.errorHandler = errorHandler;
