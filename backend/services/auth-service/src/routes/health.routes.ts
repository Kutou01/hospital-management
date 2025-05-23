import { Router, Request, Response } from 'express';
import { isSupabaseAvailable } from '../config/database.config';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const healthCheck = {
      service: 'auth-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      dependencies: {
        database: {
          status: isSupabaseAvailable() ? 'healthy' : 'unavailable',
          type: isSupabaseAvailable() ? 'supabase' : 'none'
        },
        redis: {
          status: 'unknown' // We'll implement Redis health check later
        }
      }
    };

    res.status(200).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      service: 'auth-service',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
