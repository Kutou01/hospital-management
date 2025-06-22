import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    try {
        console.log('🧹 [Clean Test Data API] Starting...');

        // Xem tất cả payments hiện tại
        const { data: allPayments, error: fetchError } = await supabase
            .from('payments')
            .select(`
                id,
                order_code,
                amount,
                description,
                status,
                patient_id,
                doctor_name,
                created_at
            `)
            .order('created_at', { ascending: false });

        if (fetchError) {
            console.error('❌ [Clean Test Data API] Fetch error:', fetchError);
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch payments',
                details: fetchError.message
            }, { status: 500 });
        }

        console.log(`📊 [Clean Test Data API] Found ${allPayments?.length || 0} payments`);

        return NextResponse.json({
            success: true,
            message: 'Payments data retrieved successfully',
            data: {
                total_payments: allPayments?.length || 0,
                payments: allPayments || []
            }
        });

    } catch (error) {
        console.error('❌ [Clean Test Data API] Unexpected error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        console.log('🗑️ [Clean Test Data API] Starting deletion...');

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        let deleteQuery;
        let description = '';

        switch (action) {
            case 'test-descriptions':
                // Xóa payments có description chứa "test"
                deleteQuery = supabase
                    .from('payments')
                    .delete()
                    .or('description.ilike.%test%,description.ilike.%thử nghiệm%,description.ilike.%Test%');
                description = 'test descriptions';
                break;

            case 'duplicates':
                // Xóa duplicates - giữ lại 1 record mới nhất cho mỗi amount
                const { data: duplicates } = await supabase
                    .from('payments')
                    .select('id, amount, created_at')
                    .order('created_at', { ascending: false });

                if (duplicates) {
                    const seen = new Set();
                    const toDelete = [];
                    
                    for (const payment of duplicates) {
                        if (seen.has(payment.amount)) {
                            toDelete.push(payment.id);
                        } else {
                            seen.add(payment.amount);
                        }
                    }

                    if (toDelete.length > 0) {
                        deleteQuery = supabase
                            .from('payments')
                            .delete()
                            .in('id', toDelete);
                        description = `${toDelete.length} duplicate payments`;
                    }
                }
                break;

            case 'today':
                // Xóa tất cả payments hôm nay
                const today = new Date().toISOString().split('T')[0];
                deleteQuery = supabase
                    .from('payments')
                    .delete()
                    .gte('created_at', `${today}T00:00:00`)
                    .lt('created_at', `${today}T23:59:59`);
                description = 'today\'s payments';
                break;

            case 'all':
                // Xóa tất cả payments (cẩn thận!)
                deleteQuery = supabase
                    .from('payments')
                    .delete()
                    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
                description = 'all payments';
                break;

            default:
                return NextResponse.json({
                    success: false,
                    error: 'Invalid action. Use: test-descriptions, duplicates, today, or all'
                }, { status: 400 });
        }

        if (!deleteQuery) {
            return NextResponse.json({
                success: false,
                error: 'No data to delete'
            });
        }

        const { data: deletedData, error: deleteError } = await deleteQuery;

        if (deleteError) {
            console.error('❌ [Clean Test Data API] Delete error:', deleteError);
            return NextResponse.json({
                success: false,
                error: 'Failed to delete payments',
                details: deleteError.message
            }, { status: 500 });
        }

        console.log(`✅ [Clean Test Data API] Successfully deleted ${description}`);

        // Lấy số lượng payments còn lại
        const { count: remainingCount } = await supabase
            .from('payments')
            .select('*', { count: 'exact', head: true });

        return NextResponse.json({
            success: true,
            message: `Successfully deleted ${description}`,
            data: {
                deleted_description: description,
                remaining_payments: remainingCount || 0
            }
        });

    } catch (error) {
        console.error('❌ [Clean Test Data API] Unexpected error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
