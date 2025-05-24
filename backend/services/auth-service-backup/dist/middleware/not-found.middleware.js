"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = void 0;
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString()
    });
};
exports.notFoundHandler = notFoundHandler;
