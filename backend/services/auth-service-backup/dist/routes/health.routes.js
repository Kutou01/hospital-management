"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_config_1 = require("../config/database.config");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const healthCheck = {
            service: 'auth-service',
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '1.0.0',
            dependencies: {
                database: {
                    status: (0, database_config_1.isSupabaseAvailable)() ? 'healthy' : 'unavailable',
                    type: (0, database_config_1.isSupabaseAvailable)() ? 'supabase' : 'none'
                },
                redis: {
                    status: 'unknown' // We'll implement Redis health check later
                }
            }
        };
        res.status(200).json(healthCheck);
    }
    catch (error) {
        res.status(503).json({
            service: 'auth-service',
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
