import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        const { patientId, count = 3 } = await request.json();
        
        if (!patientId) {
            return NextResponse.json({
                success: false,
                error: 'Patient ID is required'
            }, { status: 400 });
        }
        
        console.log(`🔄 [Create User Payments] Creating ${count} payments for patient:`, patientId);
        
        // Create sample payments for specific user
        const samplePayments = [];
        
        for (let i = 0; i < count; i++) {
            const orderCode = `${Date.now()}${String(i).padStart(3, '0')}`;
            const amounts = [200000, 300000, 400000, 500000, 600000];
            const doctors = [
                { id: 'DOC000001', name: 'BS. Nguyễn Văn A' },
                { id: 'DOC000002', name: 'BS. Trần Thị B' },
                { id: 'DOC000003', name: 'BS. Lê Văn C' },
                { id: 'DOC000004', name: 'BS. Phạm Thị D' }
            ];
            const services = [
                'Khám tổng quát',
                'Khám chuyên khoa tim mạch', 
                'Khám da liễu',
                'Tái khám',
                'Xét nghiệm máu'
            ];
            
            const randomAmount = amounts[Math.floor(Math.random() * amounts.length)];
            const randomDoctor = doctors[Math.floor(Math.random() * doctors.length)];
            const randomService = services[Math.floor(Math.random() * services.length)];
            const daysAgo = Math.floor(Math.random() * 30) + 1; // 1-30 days ago
            
            samplePayments.push({
                order_code: orderCode,
                amount: randomAmount,
                description: `${randomService} - ${randomDoctor.name}`,
                status: Math.random() > 0.2 ? 'completed' : 'pending', // 80% completed
                payment_method: 'PayOS',
                doctor_name: randomDoctor.name,
                doctor_id: randomDoctor.id,
                patient_id: patientId,
                transaction_id: Math.random() > 0.2 ? `TXN_${Date.now()}_${i}` : null,
                payment_link_id: `PL_${Date.now()}_${i}`,
                paid_at: Math.random() > 0.2 ? new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString() : null,
                created_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString()
            });
        }
        
        // Insert payments
        const { data: insertedPayments, error } = await supabase
            .from('payments')
            .insert(samplePayments)
            .select();
            
        if (error) {
            console.error('❌ [Create User Payments] Error:', error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }
        
        console.log('✅ [Create User Payments] Created payments:', insertedPayments?.length);
        
        return NextResponse.json({
            success: true,
            message: `Created ${insertedPayments?.length || 0} payments for patient ${patientId}`,
            data: {
                patient_id: patientId,
                created_count: insertedPayments?.length || 0,
                payments: insertedPayments
            }
        });
        
    } catch (error) {
        console.error('❌ [Create User Payments] Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
