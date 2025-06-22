import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        console.log('📧 [Direct Email Test] Testing email notification...');

        // Import EmailService
        const { EmailService } = await import('@/lib/services/email.service');

        // Kiểm tra cấu hình trước
        const configCheck = EmailService.checkConfiguration();
        console.log('🔧 [Direct Email Test] Configuration check:', configCheck);

        // Kiểm tra biến môi trường
        const envVars = {
            serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
            templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
            publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
        };
        console.log('🔧 [Direct Email Test] Environment variables:', {
            serviceId: !!envVars.serviceId,
            templateId: !!envVars.templateId,
            publicKey: !!envVars.publicKey,
            serviceIdValue: envVars.serviceId,
            templateIdValue: envVars.templateId
        });

        if (!configCheck) {
            return NextResponse.json({
                success: false,
                error: 'EmailJS configuration incomplete',
                details: {
                    envVars: envVars,
                    configCheck: configCheck
                }
            }, { status: 400 });
        }

        // Test data
        const testEmailData = {
            patientName: 'Nguyễn Văn Test',
            patientEmail: 'gpt2k4@gmail.com', // Email thật để test
            orderCode: `TEST-DIRECT-${Date.now()}`,
            amount: 300000,
            doctorName: 'Bác sĩ Test Email',
            paymentDate: new Date().toISOString(),
            recordId: 'REC-TEST-001'
        };

        console.log('📧 [Direct Email Test] Sending email with data:', testEmailData);

        // Gửi email
        const emailResult = await EmailService.sendPaymentSuccessEmail(testEmailData);

        console.log('📧 [Direct Email Test] Email result:', emailResult);

        return NextResponse.json({
            success: true,
            message: 'Direct email test completed',
            data: {
                testData: testEmailData,
                emailResult: emailResult,
                configCheck: configCheck,
                envVars: {
                    serviceId: !!envVars.serviceId,
                    templateId: !!envVars.templateId,
                    publicKey: !!envVars.publicKey
                }
            }
        });

    } catch (error) {
        console.error('💥 [Direct Email Test] Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to send test email',
            details: error.message
        }, { status: 500 });
    }
}
