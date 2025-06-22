import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
    const startTime = Date.now();
    const status = {
        server: {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'unknown',
        },
        services: {
            supabase: {
                status: 'unknown',
                message: '',
            },
            payos: {
                status: 'unknown',
                message: '',
            }
        },
        environment: {
            supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing',
            supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'missing',
            supabase_service_role: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'missing',
            payos_client_id: process.env.PAYOS_CLIENT_ID ? 'set' : 'missing',
            payos_api_key: process.env.PAYOS_API_KEY ? 'set' : 'missing',
            payos_checksum_key: process.env.PAYOS_CHECKSUM_KEY ? 'set' : 'missing',
            payos_api_url: process.env.PAYOS_API_URL ? 'set' : 'missing',
        }
    };

    // Check Supabase connection
    try {
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            );

            // Simple query to check connection
            const { error } = await supabase.from('payments').select('id').limit(1);

            if (error) {
                status.services.supabase.status = 'error';
                status.services.supabase.message = `Database error: ${error.message}`;
            } else {
                status.services.supabase.status = 'ok';
                status.services.supabase.message = 'Connected successfully';
            }
        } else {
            status.services.supabase.status = 'error';
            status.services.supabase.message = 'Missing environment variables';
        }
    } catch (error) {
        status.services.supabase.status = 'error';
        status.services.supabase.message = error instanceof Error ? error.message : 'Unknown error';
    }

    // Check PayOS configuration (we don't actually call their API to avoid rate limits)
    if (
        process.env.PAYOS_CLIENT_ID &&
        process.env.PAYOS_API_KEY &&
        process.env.PAYOS_CHECKSUM_KEY &&
        process.env.PAYOS_API_URL
    ) {
        status.services.payos.status = 'ok';
        status.services.payos.message = 'Configuration found';
    } else {
        status.services.payos.status = 'error';
        status.services.payos.message = 'Missing environment variables';
    }

    // Add response time
    const responseTime = Date.now() - startTime;
    return NextResponse.json({
        ...status,
        meta: {
            response_time_ms: responseTime
        }
    });
} 