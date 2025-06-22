import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { jsPDF } from 'jspdf';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orderCode: string }> }
) {
    try {
        const supabase = await createClient();
        const { orderCode } = await params;
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'html'; // html or pdf

        // Fetch payment data
        const { data: payment, error } = await supabase
            .from('payments')
            .select('*')
            .eq('order_code', orderCode)
            .single();

        if (error || !payment) {
            return NextResponse.json({
                success: false,
                error: 'Payment not found'
            }, { status: 404 });
        }

        if (format === 'pdf') {
            try {
                console.log('Generating PDF for payment:', payment.order_code);
                const pdfBuffer = await generateInvoicePDF(payment);
                console.log('PDF generated successfully, buffer size:', pdfBuffer.length);

                return new NextResponse(pdfBuffer, {
                    headers: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `attachment; filename="hoa-don-${orderCode}.pdf"`
                    }
                });
            } catch (error) {
                console.error('PDF generation failed:', error);
                console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');

                // Return error response instead of fallback to HTML
                return NextResponse.json({
                    success: false,
                    error: 'Không thể tạo file PDF. Vui lòng thử lại sau.',
                    details: error instanceof Error ? error.message : 'Unknown error'
                }, { status: 500 });
            }
        } else {
            // Debug payment data
            console.log('Payment data for invoice:', {
                order_code: payment.order_code,
                created_at: payment.created_at,
                paid_at: payment.paid_at,
                created_at_parsed: new Date(payment.created_at),
                paid_at_parsed: payment.paid_at ? new Date(payment.paid_at) : null
            });

            // Generate HTML invoice
            const invoiceHtml = generateInvoiceHTML(payment);

            return new NextResponse(invoiceHtml, {
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Content-Disposition': `inline; filename="hoa-don-${orderCode}.html"`
                }
            });
        }

    } catch (error) {
        console.error('Invoice API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}

// Helper functions
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh'
    });
}

function getStatusText(status: string): string {
    switch (status) {
        case 'completed': return 'Đã thanh toán';
        case 'pending': return 'Đang chờ';
        case 'failed': return 'Thất bại';
        default: return status;
    }
}

function getStatusTextPlain(status: string): string {
    switch (status) {
        case 'completed': return 'Da thanh toan';
        case 'pending': return 'Dang cho';
        case 'failed': return 'That bai';
        default: return status;
    }
}

function removeVietnameseDiacritics(str: string): string {
    return str
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ỳýỵỷỹ]/g, 'y')
        .replace(/đ/g, 'd')
        .replace(/[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]/g, 'A')
        .replace(/[ÈÉẸẺẼÊỀẾỆỂỄ]/g, 'E')
        .replace(/[ÌÍỊỈĨ]/g, 'I')
        .replace(/[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]/g, 'O')
        .replace(/[ÙÚỤỦŨƯỪỨỰỬỮ]/g, 'U')
        .replace(/[ỲÝỴỶỸ]/g, 'Y')
        .replace(/Đ/g, 'D');
}

async function generateInvoicePDF(payment: any): Promise<Buffer> {
    try {
        console.log('Creating PDF document with jsPDF...');

        // Tạo PDF document với jsPDF
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        console.log('Setting up PDF content...');

        // Header
        doc.setFontSize(20);
        doc.text('BENH VIEN DA KHOA', 105, 30, { align: 'center' });

        doc.setFontSize(12);
        doc.text('Dia chi: 123 Duong ABC, Quan XYZ, TP. Ho Chi Minh', 105, 40, { align: 'center' });
        doc.text('Dien thoai: (028) 1234 5678 | Email: info@hospital.com', 105, 50, { align: 'center' });

        // Đường kẻ ngang
        doc.line(20, 60, 190, 60);

        // Title
        doc.setFontSize(18);
        doc.text('HOA DON THANH TOAN', 105, 75, { align: 'center' });

        // Payment info
        let yPos = 90;

        // Thông tin cơ bản
        doc.setFontSize(14);
        doc.text('THONG TIN HOA DON', 20, yPos);
        yPos += 10;

        doc.setFontSize(12);
        doc.text('Ma don hang: ' + payment.order_code, 20, yPos);
        yPos += 8;

        // Xử lý tên bác sĩ - chuyển về không dấu
        const doctorNameClean = removeVietnameseDiacritics(payment.doctor_name || 'N/A');
        doc.text('Bac si: ' + doctorNameClean, 20, yPos);
        yPos += 8;

        // Xử lý dịch vụ - chuyển về không dấu
        const serviceNameClean = removeVietnameseDiacritics(payment.description || 'Thanh toan kham benh');
        doc.text('Dich vu: ' + serviceNameClean, 20, yPos);
        yPos += 8;

        doc.text('Phuong thuc thanh toan: ' + (payment.payment_method || 'payos'), 20, yPos);
        yPos += 8;
        doc.text('Trang thai: ' + getStatusTextPlain(payment.status), 20, yPos);
        yPos += 8;

        // Mã giao dịch nếu có
        if (payment.transaction_id) {
            doc.text('Ma giao dich: ' + payment.transaction_id, 20, yPos);
            yPos += 8;
        }

        // Time info
        yPos += 10;
        doc.setFontSize(14);
        doc.text('THONG TIN THOI GIAN', 20, yPos);
        yPos += 10;

        doc.setFontSize(12);
        doc.text('Ngay tao giao dich: ' + formatDate(payment.created_at), 20, yPos);
        yPos += 8;

        // Xóa phần ngày thanh toán theo yêu cầu

        doc.text('Ngay tao hoa don: ' + formatDate(new Date().toISOString()), 20, yPos);
        yPos += 15;

        // Tổng tiền - nổi bật
        doc.rect(20, yPos, 170, 20);
        doc.setFontSize(16);
        doc.text('TONG TIEN: ' + formatCurrency(payment.amount), 25, yPos + 12);
        yPos += 30;

        // Footer
        doc.setFontSize(10);
        doc.text('Cam on ban da su dung dich vu cua chung toi!', 105, yPos, { align: 'center' });
        yPos += 8;
        doc.text('Hoa don duoc tao vao ' + formatDate(new Date().toISOString()), 105, yPos, { align: 'center' });

        // Tạo buffer từ PDF
        console.log('Finalizing PDF document...');
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        console.log('PDF document created successfully, size:', pdfBuffer.length);

        return pdfBuffer;
    } catch (error) {
        console.error('Error in PDF generation:', error);
        throw error;
    }
}

function generateInvoiceHTML(payment: any): string {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Ho_Chi_Minh'
        });
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed': return 'Đã thanh toán';
            case 'pending': return 'Đang chờ';
            case 'failed': return 'Thất bại';
            default: return status;
        }
    };

    return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hóa đơn thanh toán - ${payment.order_code}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #0066CC;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .hospital-name {
            font-size: 28px;
            font-weight: bold;
            color: #0066CC;
            margin-bottom: 5px;
        }
        .hospital-info {
            color: #666;
            font-size: 14px;
        }
        .invoice-title {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin: 30px 0;
            color: #333;
        }
        .info-section {
            margin-bottom: 25px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .info-label {
            font-weight: bold;
            color: #555;
            min-width: 150px;
        }
        .info-value {
            color: #333;
            text-align: right;
        }
        .amount-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .total-amount {
            font-size: 24px;
            font-weight: bold;
            color: #0066CC;
            text-align: center;
        }
        .status {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 12px;
        }
        .status.completed {
            background: #d4edda;
            color: #155724;
        }
        .status.pending {
            background: #fff3cd;
            color: #856404;
        }
        .status.failed {
            background: #f8d7da;
            color: #721c24;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 12px;
        }
        .print-button {
            background: #0066CC;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 20px auto;
            display: block;
            font-size: 16px;
        }
        @media print {
            .print-button {
                display: none;
            }
            body {
                background: white;
            }
            .invoice-container {
                box-shadow: none;
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="hospital-name">BỆNH VIỆN ĐA KHOA</div>
            <div class="hospital-info">
                Địa chỉ: 123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh<br>
                Điện thoại: (028) 1234 5678 | Email: info@hospital.com
            </div>
        </div>

        <div class="invoice-title">HÓA ĐƠN THANH TOÁN</div>

        <div class="info-section">
            <div class="info-row">
                <span class="info-label">Mã đơn hàng:</span>
                <span class="info-value">${payment.order_code}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Ngày tạo giao dịch:</span>
                <span class="info-value">${formatDate(payment.created_at)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Ngày tạo hóa đơn:</span>
                <span class="info-value">${formatDate(new Date().toISOString())}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Bác sĩ:</span>
                <span class="info-value">${payment.doctor_name || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Phương thức thanh toán:</span>
                <span class="info-value">${payment.payment_method || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Trạng thái:</span>
                <span class="info-value">
                    <span class="status ${payment.status}">${getStatusText(payment.status)}</span>
                </span>
            </div>
            ${payment.transaction_id ? `
            <div class="info-row">
                <span class="info-label">Mã giao dịch:</span>
                <span class="info-value">${payment.transaction_id}</span>
            </div>
            ` : ''}
        </div>

        <div class="info-section">
            <div class="info-row">
                <span class="info-label">Dịch vụ:</span>
                <span class="info-value">${payment.description || 'Dịch vụ khám bệnh'}</span>
            </div>
        </div>

        <div class="amount-section">
            <div class="total-amount">
                Tổng tiền: ${formatCurrency(payment.amount)}
            </div>
        </div>

        <button class="print-button" onclick="window.print()">In hóa đơn</button>

        <div class="footer">
            <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
            <p>Hóa đơn được tạo vào ${formatDate(new Date().toISOString())}</p>
        </div>
    </div>
</body>
</html>
    `.trim();
}
