import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        
        // Check authentication and admin role
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized - Please login first'
            }, { status: 401 });
        }

        // Get user profile to check admin role
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('id', user.id)
            .single();

        if (profileError || !profile || profile.role !== 'admin') {
            return NextResponse.json({
                success: false,
                error: 'Access denied - Admin role required'
            }, { status: 403 });
        }

        // Get query parameters
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const doctorId = searchParams.get('doctorId');
        const patientId = searchParams.get('patientId');
        const orderCode = searchParams.get('orderCode');

        const offset = (page - 1) * limit;

        console.log('🔑 [Admin Payments API] Admin access:', {
            userId: user.id,
            page, limit, status, startDate, endDate, doctorId, patientId, orderCode
        });

        // Build query for all payments (admin can see everything)
        let query = supabase
            .from('payments')
            .select(`
                id,
                order_code,
                amount,
                description,
                status,
                payment_method,
                doctor_name,
                doctor_id,
                patient_id,
                transaction_id,
                payment_link_id,
                created_at,
                updated_at,
                paid_at,
                record_id
            `)
            .order('created_at', { ascending: false })  // Newest first
            .range(offset, offset + limit - 1);

        // Apply filters
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        if (startDate) {
            query = query.gte('created_at', startDate);
        }

        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        if (doctorId) {
            query = query.eq('doctor_id', doctorId);
        }

        if (patientId) {
            query = query.eq('patient_id', patientId);
        }

        if (orderCode) {
            query = query.ilike('order_code', `%${orderCode}%`);
        }

        // Execute query
        const { data: payments, error: paymentsError } = await query;

        if (paymentsError) {
            console.error('Error fetching payments:', paymentsError);
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch payments'
            }, { status: 500 });
        }

        // Get total count for pagination
        let countQuery = supabase
            .from('payments')
            .select('*', { count: 'exact', head: true });

        // Apply same filters for count
        if (status && status !== 'all') {
            countQuery = countQuery.eq('status', status);
        }
        if (startDate) {
            countQuery = countQuery.gte('created_at', startDate);
        }
        if (endDate) {
            countQuery = countQuery.lte('created_at', endDate);
        }
        if (doctorId) {
            countQuery = countQuery.eq('doctor_id', doctorId);
        }
        if (patientId) {
            countQuery = countQuery.eq('patient_id', patientId);
        }
        if (orderCode) {
            countQuery = countQuery.ilike('order_code', `%${orderCode}%`);
        }

        const { count, error: countError } = await countQuery;

        if (countError) {
            console.error('Error counting payments:', countError);
        }

        // Calculate summary statistics
        const { data: allPayments, error: summaryError } = await supabase
            .from('payments')
            .select('status, amount, transaction_id, payment_link_id, paid_at, patient_id');

        let summary = {
            totalPayments: 0,
            totalAmount: 0,
            completedPayments: 0,
            completedAmount: 0,
            pendingPayments: 0,
            pendingAmount: 0,
            failedPayments: 0,
            syncedPayments: 0,
            syncRate: 0,
            paymentsWithPatientId: 0,
            patientIdRate: 0
        };

        if (!summaryError && allPayments) {
            summary.totalPayments = allPayments.length;
            summary.totalAmount = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
            
            const completed = allPayments.filter(p => p.status === 'completed');
            summary.completedPayments = completed.length;
            summary.completedAmount = completed.reduce((sum, p) => sum + (p.amount || 0), 0);
            
            const pending = allPayments.filter(p => p.status === 'pending');
            summary.pendingPayments = pending.length;
            summary.pendingAmount = pending.reduce((sum, p) => sum + (p.amount || 0), 0);
            
            summary.failedPayments = allPayments.filter(p => p.status === 'failed').length;
            
            summary.syncedPayments = allPayments.filter(p => p.transaction_id || p.payment_link_id).length;
            summary.syncRate = summary.totalPayments > 0 ? (summary.syncedPayments / summary.totalPayments) * 100 : 0;
            
            summary.paymentsWithPatientId = allPayments.filter(p => p.patient_id).length;
            summary.patientIdRate = summary.totalPayments > 0 ? (summary.paymentsWithPatientId / summary.totalPayments) * 100 : 0;
        }

        return NextResponse.json({
            success: true,
            data: {
                payments: payments || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / limit)
                },
                summary
            }
        });

    } catch (error) {
        console.error('Admin payments API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
