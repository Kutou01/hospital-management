import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'excel'; // excel, csv, pdf
        const status = searchParams.get('status');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const doctorId = searchParams.get('doctorId');

        // Build query for all payments (simplified for testing)
        let query = supabase
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false });

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

        const { data: payments, error } = await query;

        if (error) {
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch payment data'
            }, { status: 500 });
        }

        // Format data for export (simplified)
        const exportData = payments?.map(payment => ({
            'Mã đơn hàng': payment.order_code,
            'Ngày tạo': new Date(payment.created_at).toLocaleDateString('vi-VN'),
            'Ngày thanh toán': payment.paid_at ?
                new Date(payment.paid_at).toLocaleDateString('vi-VN') : 'Chưa thanh toán',
            'Bác sĩ': payment.doctor_name || 'N/A',
            'Mã bác sĩ': payment.doctor_id || 'N/A',
            'Số tiền': payment.amount?.toLocaleString('vi-VN') + ' VNĐ',
            'Phương thức': payment.payment_method || 'N/A',
            'Trạng thái': payment.status === 'completed' ? 'Hoàn thành' :
                         payment.status === 'pending' ? 'Đang xử lý' : 'Thất bại',
            'Mô tả': payment.description || '',
            'Mã hồ sơ': payment.record_id || 'N/A'
        })) || [];

        if (format === 'excel') {
            // Generate Excel file
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Payment History');

            // Set column widths
            const colWidths = [
                { wch: 15 }, // Mã đơn hàng
                { wch: 12 }, // Ngày thanh toán
                { wch: 20 }, // Bệnh nhân
                { wch: 20 }, // Bác sĩ
                { wch: 15 }, // Chuyên khoa
                { wch: 15 }, // Số tiền
                { wch: 12 }, // Phương thức
                { wch: 12 }, // Trạng thái
                { wch: 30 }, // Mô tả
                { wch: 12 }  // Ngày khám
            ];
            ws['!cols'] = colWidths;

            const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            return new NextResponse(excelBuffer, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="payment-history-${new Date().toISOString().split('T')[0]}.xlsx"`,
                },
            });

        } else if (format === 'csv') {
            // Generate CSV file
            const ws = XLSX.utils.json_to_sheet(exportData);
            const csvContent = XLSX.utils.sheet_to_csv(ws);

            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="payment-history-${new Date().toISOString().split('T')[0]}.csv"`,
                },
            });
        }

        return NextResponse.json({
            success: false,
            error: 'Unsupported export format'
        }, { status: 400 });

    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
