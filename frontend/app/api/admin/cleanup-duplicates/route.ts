import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        console.log('🧹 Starting duplicate payment cleanup...');
        
        // 1. Tìm các order_code bị trùng lặp
        const { data: duplicates, error: findError } = await supabase
            .from('payments')
            .select('order_code, COUNT(*) as count')
            .not('order_code', 'is', null)
            .group('order_code')
            .having('COUNT(*)', 'gt', 1);
            
        if (findError) {
            throw findError;
        }
        
        console.log(`🔍 Found ${duplicates?.length || 0} order codes with duplicates`);
        
        let totalRemoved = 0;
        const cleanupResults = [];
        
        // 2. Xử lý từng order_code bị trùng lặp
        for (const duplicate of duplicates || []) {
            const orderCode = duplicate.order_code;
            
            // Lấy tất cả payments với order_code này
            const { data: payments, error: paymentsError } = await supabase
                .from('payments')
                .select('*')
                .eq('order_code', orderCode)
                .order('created_at', { ascending: false }); // Mới nhất trước
                
            if (paymentsError || !payments || payments.length <= 1) {
                continue;
            }
            
            // Giữ lại payment mới nhất (đầu tiên trong danh sách)
            const keepPayment = payments[0];
            const removePayments = payments.slice(1);
            
            console.log(`🔄 Processing ${orderCode}: keeping ${keepPayment.id}, removing ${removePayments.length} duplicates`);
            
            // Xóa các payments trùng lặp
            for (const payment of removePayments) {
                const { error: deleteError } = await supabase
                    .from('payments')
                    .delete()
                    .eq('id', payment.id);
                    
                if (deleteError) {
                    console.error(`❌ Error deleting payment ${payment.id}:`, deleteError);
                } else {
                    totalRemoved++;
                    console.log(`✅ Removed duplicate payment ${payment.id}`);
                }
            }
            
            cleanupResults.push({
                orderCode,
                kept: keepPayment.id,
                removed: removePayments.length,
                removedIds: removePayments.map(p => p.id)
            });
        }
        
        // 3. Thống kê sau khi dọn dẹp
        const { data: finalStats, error: statsError } = await supabase
            .from('payments')
            .select('order_code, COUNT(*) as count')
            .not('order_code', 'is', null)
            .group('order_code')
            .having('COUNT(*)', 'gt', 1);
            
        console.log(`🎉 Cleanup completed! Removed ${totalRemoved} duplicate payments`);
        console.log(`📊 Remaining duplicates: ${finalStats?.length || 0}`);
        
        return NextResponse.json({
            success: true,
            message: 'Duplicate cleanup completed',
            data: {
                duplicatesFound: duplicates?.length || 0,
                totalRemoved,
                remainingDuplicates: finalStats?.length || 0,
                cleanupResults
            }
        });
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// GET method để kiểm tra duplicates mà không xóa
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        // Tìm các order_code bị trùng lặp
        const { data: duplicates, error } = await supabase
            .from('payments')
            .select('order_code, COUNT(*) as count')
            .not('order_code', 'is', null)
            .group('order_code')
            .having('COUNT(*)', 'gt', 1);
            
        if (error) {
            throw error;
        }
        
        // Lấy chi tiết các payments trùng lặp
        const duplicateDetails = [];
        for (const duplicate of duplicates || []) {
            const { data: payments } = await supabase
                .from('payments')
                .select('*')
                .eq('order_code', duplicate.order_code)
                .order('created_at', { ascending: false });
                
            duplicateDetails.push({
                orderCode: duplicate.order_code,
                count: duplicate.count,
                payments: payments || []
            });
        }
        
        return NextResponse.json({
            success: true,
            data: {
                duplicatesFound: duplicates?.length || 0,
                duplicateDetails
            }
        });
        
    } catch (error) {
        console.error('Error checking duplicates:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
