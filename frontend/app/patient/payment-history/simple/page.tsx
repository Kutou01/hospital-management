'use client';

import { PatientLayout } from '@/components/layout';

export default function SimplePaymentHistoryPage() {
    console.log('🚀 [Simple Payment History] Component rendered!');
    
    return (
        <PatientLayout
            title="Lịch sử thanh toán"
            activePage="payment-history"
            subtitle="Test page"
        >
            <div className="p-8">
                <h1 className="text-2xl font-bold text-blue-600 mb-4">
                    ✅ Simple Payment History Page Works!
                </h1>
                <p className="text-gray-600">
                    PatientLayout is working correctly.
                </p>
                <p className="text-sm text-gray-500 mt-4">
                    Check console for: 🚀 [Simple Payment History] Component rendered!
                </p>
            </div>
        </PatientLayout>
    );
}
