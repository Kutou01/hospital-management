"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (error, req, res, next) => {
    console.error('API Gateway Error', {
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
exports.errorHandler = errorHandler;
