/**
 * Unified Chatbot API Endpoint
 * Single endpoint that handles all chatbot functionality
 * Replaces multiple fragmented endpoints
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { unifiedChatbot } from '../../../lib/services/unified-chatbot.service';
import { errorHandler } from '../../../lib/services/error-handling.service';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8'
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  const startTime = Date.now();
  console.log('🚀 [Unified Chatbot API] Request received');

  try {
    // Validate request body
    const { message, sessionId, userId, conversationHistory, metadata } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a non-empty string'
      });
    }

    // Rate limiting check (simple implementation)
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (await isRateLimited(clientIP as string)) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please wait before sending another message.'
      });
    }

    console.log('📝 [Unified Chatbot API] Processing message:', {
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      sessionId,
      userId,
      clientIP
    });

    // Process message with unified chatbot service
    const response = await unifiedChatbot.processMessage({
      message: message.trim(),
      sessionId,
      userId,
      conversationHistory,
      metadata
    });

    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    console.log('✅ [Unified Chatbot API] Response generated:', {
      success: response.success,
      source: response.data.response_source,
      intent: response.data.intent,
      emergency: response.data.emergency,
      processingTime: `${processingTime}ms`
    });

    // Add metadata to response
    const enhancedResponse = {
      ...response,
      metadata: {
        processingTime,
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        service: 'unified-chatbot'
      }
    };

    return res.status(200).json(enhancedResponse);

  } catch (error) {
    console.error('❌ [Unified Chatbot API] Unhandled error:', error);

    // Use error handling service
    const chatbotError = errorHandler.createError(
      'API_UNHANDLED_ERROR',
      'Unhandled error in chatbot API',
      error
    );

    const processingTime = Date.now() - startTime;

    return res.status(500).json({
      success: false,
      data: {
        ai_response: chatbotError.userMessage,
        response_source: 'error_handler'
      },
      error: chatbotError.message,
      metadata: {
        processingTime,
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        service: 'unified-chatbot'
      }
    });
  }
}

/**
 * Simple rate limiting implementation
 * In production, use Redis or a proper rate limiting service
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

async function isRateLimited(clientIP: string): Promise<boolean> {
  const now = Date.now();
  const clientData = requestCounts.get(clientIP);

  if (!clientData || now > clientData.resetTime) {
    // Reset or initialize counter
    requestCounts.set(clientIP, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return false;
  }

  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  // Increment counter
  clientData.count++;
  requestCounts.set(clientIP, clientData);

  return false;
}

/**
 * Health check endpoint
 */
export async function healthCheck(): Promise<{
  status: string;
  timestamp: string;
  services: Record<string, string>;
}> {
  try {
    // Check various services
    const services = {
      'unified-chatbot': 'healthy',
      'vietnamese-nlp': 'healthy',
      'payos-service': 'healthy',
      'error-handler': 'healthy'
    };

    // Could add actual health checks here
    // e.g., database connectivity, external API status

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services
    };

  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        'unified-chatbot': 'error'
      }
    };
  }
}

/**
 * Get service statistics
 */
export async function getStats(): Promise<{
  errorStats: any;
  requestCounts: number;
  uptime: string;
}> {
  const errorStats = errorHandler.getErrorStats();
  const totalRequests = Array.from(requestCounts.values())
    .reduce((sum, data) => sum + data.count, 0);

  return {
    errorStats,
    requestCounts: totalRequests,
    uptime: process.uptime().toString()
  };
}

// Clean up rate limiting data periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW);

console.log('🚀 [Unified Chatbot API] Service initialized');
