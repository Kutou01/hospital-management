'use client';

import React, { useState } from 'react';
import { EmailService } from '@/lib/services/email.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EmailDebugPage() {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const [testEmail, setTestEmail] = useState('hoang.cuong1@gmail.com');

    const testEmailData = {
        patientName: 'Nguyễn Văn Test',
        patientEmail: testEmail,
        orderCode: 'TEST123456789',
        amount: 500000,
        doctorName: 'Dr. Test Doctor',
        paymentDate: new Date().toISOString(),
        recordId: 'MR-TEST123'
    };

    const handleTestEmail = async () => {
        setLoading(true);
        setResult(null);

        try {
            console.log('🧪 [Email Debug] Starting email test...');
            
            // Kiểm tra cấu hình
            console.log('🔧 [Email Debug] Environment variables:', {
                serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
                templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
                publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ? 'SET' : 'NOT_SET'
            });

            const configValid = EmailService.checkConfiguration();
            console.log('🔧 [Email Debug] Configuration valid:', configValid);

            if (!configValid) {
                setResult({
                    success: false,
                    message: 'EmailJS configuration is invalid',
                    error: 'INVALID_CONFIG'
                });
                return;
            }

            // Gửi email test
            console.log('📧 [Email Debug] Sending test email with data:', testEmailData);
            
            const emailResult = await EmailService.sendPaymentSuccessEmail(testEmailData);
            
            console.log('📧 [Email Debug] Email result:', emailResult);
            setResult(emailResult);

        } catch (error: any) {
            console.error('❌ [Email Debug] Test failed:', error);
            setResult({
                success: false,
                message: 'Test failed with exception',
                error: error.message || 'UNKNOWN_ERROR'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>🧪 Email Debug Test</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold mb-2">Email Address:</h3>
                        <input
                            type="email"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            className="w-full p-2 border rounded"
                            placeholder="Enter email to test"
                        />
                    </div>

                    <div>
                        <h3 className="font-semibold mb-2">Test Data:</h3>
                        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                            {JSON.stringify(testEmailData, null, 2)}
                        </pre>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-2">Environment Check:</h3>
                        <div className="bg-gray-100 p-3 rounded text-sm">
                            <p>Service ID: {process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'NOT_SET'}</p>
                            <p>Template ID: {process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'NOT_SET'}</p>
                            <p>Public Key: {process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ? 'SET' : 'NOT_SET'}</p>
                        </div>
                    </div>

                    <Button 
                        onClick={handleTestEmail} 
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? 'Đang gửi...' : 'Gửi Email Test'}
                    </Button>

                    {result && (
                        <div>
                            <h3 className="font-semibold mb-2">Kết quả:</h3>
                            <div className={`p-3 rounded ${
                                result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                                <pre className="text-sm overflow-auto">
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
