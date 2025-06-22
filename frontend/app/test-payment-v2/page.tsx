'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';

interface Payment {
    id: string;
    order_code: string;
    amount: number;
    description: string;
    status: 'pending' | 'completed' | 'failed';
    payment_method: string;
    doctor_name: string;
    created_at: string;
    paid_at: string | null;
    updated_at: string;
    transaction_id?: string;
    payment_link_id?: string;
    medical_records?: {
        record_id: string;
        visit_date: string;
        diagnosis: string;
        treatment_plan?: string;
        chief_complaint?: string;
        patients?: {
            patient_id: string;
            full_name: string;
        };
    };
}

export default function TestPaymentV2Page() {
    const [v1Data, setV1Data] = useState<any>(null);
    const [v2Data, setV2Data] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [creatingData, setCreatingData] = useState(false);
    const [setupData, setSetupData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    // Check user setup on component mount
    useEffect(() => {
        checkUserSetup();
    }, []);

    const checkUserSetup = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.access_token) {
                setError('Không tìm thấy session. Vui lòng đăng nhập lại.');
                return;
            }

            const response = await fetch('/api/test/check-user-setup', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                }
            });

            const result = await response.json();

            if (result.success) {
                setSetupData(result.data);
                console.log('👤 [User Setup Check]:', result.data);
            } else {
                setError(result.error);
            }
        } catch (err) {
            console.error('❌ Check user setup error:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };

    const setupUser = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.access_token) {
                setError('Không tìm thấy session. Vui lòng đăng nhập lại.');
                return;
            }

            const response = await fetch('/api/test/check-user-setup', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                }
            });

            const result = await response.json();

            if (result.success) {
                alert('✅ User setup thành công!');
                await checkUserSetup(); // Refresh setup data
            } else {
                setError(result.error);
            }
        } catch (err) {
            console.error('❌ Setup user error:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };

    const testBothAPIs = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Get auth token
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session?.access_token) {
                setError('Không tìm thấy session. Vui lòng đăng nhập lại.');
                return;
            }

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            };

            // Test V1 API
            console.log('🧪 Testing V1 API...');
            const v1Response = await fetch('/api/patient/payment-history?page=1&limit=5', {
                headers
            });
            const v1Result = await v1Response.json();
            setV1Data(v1Result);
            console.log('✅ V1 API Result:', v1Result);

            // Test V2 API
            console.log('🧪 Testing V2 API...');
            const v2Response = await fetch('/api/patient/payment-history-v2?page=1&limit=5', {
                headers
            });
            const v2Result = await v2Response.json();
            setV2Data(v2Result);
            console.log('✅ V2 API Result:', v2Result);

        } catch (err) {
            console.error('❌ Test error:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const createTestData = async () => {
        setCreatingData(true);
        setError(null);

        try {
            // Check if user setup is complete
            if (!setupData?.profile || !setupData?.patient) {
                setError('Vui lòng setup user trước khi tạo test data!');
                return;
            }

            // Get auth token
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.access_token) {
                setError('Không tìm thấy session. Vui lòng đăng nhập lại.');
                return;
            }

            console.log('🧪 Creating full test data (payments + medical records)...');
            const response = await fetch('/api/test/create-full-test-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                }
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ Full test data created:', result);
                alert(`✅ Đã tạo test data thành công!\n` +
                      `- Medical Records: ${result.data?.medical_records_created || 0}\n` +
                      `- Payments: ${result.data?.payments_created || 0}\n` +
                      `- Có bệnh án: ${result.data?.payments_with_records || 0}\n` +
                      `- Không có bệnh án: ${result.data?.payments_without_records || 0}`);

                // Refresh setup data và test APIs
                await checkUserSetup();
                await testBothAPIs();
            } else {
                setError(result.error || 'Failed to create test data');
            }
        } catch (err) {
            console.error('❌ Create test data error:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setCreatingData(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const renderPaymentCard = (payment: Payment, apiVersion: string) => (
        <div key={`${apiVersion}-${payment.id}`} className="border rounded-lg p-3 mb-2">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">#{payment.order_code}</span>
                    <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                        {payment.status}
                    </Badge>
                </div>
                <span className="text-sm font-bold text-green-600">
                    {formatCurrency(payment.amount)}
                </span>
            </div>
            
            <div className="text-sm text-gray-600 mb-2">
                <div>Bác sĩ: {payment.doctor_name}</div>
                <div>Phương thức: {payment.payment_method}</div>
                {payment.description && <div>Mô tả: {payment.description}</div>}
            </div>

            {/* Medical Records Info */}
            {payment.medical_records ? (
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                    <div className="font-semibold text-blue-700">🏥 Hồ sơ bệnh án:</div>
                    <div>Mã: {payment.medical_records.record_id}</div>
                    <div>Ngày khám: {new Date(payment.medical_records.visit_date).toLocaleDateString('vi-VN')}</div>
                    {payment.medical_records.diagnosis && (
                        <div>Chẩn đoán: {payment.medical_records.diagnosis}</div>
                    )}
                    {payment.medical_records.patients && (
                        <div>Bệnh nhân: {payment.medical_records.patients.full_name} ({payment.medical_records.patients.patient_id})</div>
                    )}
                </div>
            ) : (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-500">
                    ❌ Không có thông tin bệnh án
                </div>
            )}
        </div>
    );

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold mb-4">🧪 Test Payment History V2</h1>
                <p className="text-gray-600 mb-6">
                    So sánh API V1 (trực tiếp database) vs V2 (qua billing service)
                </p>
                
                <div className="flex gap-4 mb-6">
                    <Button
                        onClick={testBothAPIs}
                        disabled={loading || creatingData || !setupData?.profile}
                    >
                        {loading ? 'Đang test...' : 'Test cả 2 API'}
                    </Button>

                    <Button
                        onClick={createTestData}
                        disabled={loading || creatingData || !setupData?.profile || !setupData?.patient}
                        variant="outline"
                    >
                        {creatingData ? 'Đang tạo...' : '🏥 Tạo dữ liệu đầy đủ (Payments + Medical Records)'}
                    </Button>
                </div>

                {(!setupData?.profile || !setupData?.patient) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <div className="text-yellow-700 font-semibold">⚠️ Cần setup user:</div>
                        <div className="text-yellow-600">Vui lòng setup Profile và Patient record trước khi test!</div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="text-red-700 font-semibold">❌ Lỗi:</div>
                        <div className="text-red-600">{error}</div>
                    </div>
                )}

                {/* User Setup Status */}
                {setupData && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>👤 Trạng thái User Setup</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="font-semibold mb-2">User Info:</div>
                                    <div>ID: {setupData.user?.id?.substring(0, 8)}...</div>
                                    <div>Email: {setupData.user?.email}</div>
                                </div>
                                <div>
                                    <div className="font-semibold mb-2">Setup Status:</div>
                                    <div className={setupData.profile ? 'text-green-600' : 'text-red-600'}>
                                        Profile: {setupData.profile ? '✅ OK' : '❌ Missing'}
                                    </div>
                                    <div className={setupData.patient ? 'text-green-600' : 'text-red-600'}>
                                        Patient: {setupData.patient ? '✅ OK' : '❌ Missing'}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-gray-50 rounded">
                                <div className="font-semibold mb-2">Database Stats:</div>
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>Total Payments: {setupData.database_stats?.total_payments || 0}</div>
                                    <div>Total Medical Records: {setupData.database_stats?.total_medical_records || 0}</div>
                                    <div>Payments with Patient ID: {setupData.database_stats?.payments_with_patient_id || 0}</div>
                                    <div>Payments with Record ID: {setupData.database_stats?.payments_with_record_id || 0}</div>
                                </div>
                            </div>

                            {(setupData.setup_needed?.profile || setupData.setup_needed?.patient) && (
                                <div className="mt-4">
                                    <Button onClick={setupUser} variant="outline" className="w-full">
                                        🔧 Setup User (Tạo Profile + Patient Record)
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* V1 API Results */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            🔵 API V1 (Direct Database)
                            {v1Data && (
                                <Badge variant="outline">
                                    {v1Data.data?.payments?.length || 0} payments
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {v1Data ? (
                            <div>
                                <div className="mb-4 p-3 bg-gray-50 rounded">
                                    <div className="text-sm">
                                        <div>✅ Success: {v1Data.success ? 'Yes' : 'No'}</div>
                                        <div>📊 Total: {v1Data.data?.pagination?.total || 0}</div>
                                        <div>💰 Total Paid: {formatCurrency(v1Data.data?.summary?.totalPaid || 0)}</div>
                                        <div>🔄 Source: {v1Data.source || 'v1-direct'}</div>
                                    </div>
                                </div>
                                
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {v1Data.data?.payments?.map((payment: Payment) => 
                                        renderPaymentCard(payment, 'v1')
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-500 text-center py-8">
                                Chưa có dữ liệu V1
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* V2 API Results */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            🟢 API V2 (Billing Service)
                            {v2Data && (
                                <Badge variant="outline">
                                    {v2Data.data?.payments?.length || 0} payments
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {v2Data ? (
                            <div>
                                <div className="mb-4 p-3 bg-gray-50 rounded">
                                    <div className="text-sm">
                                        <div>✅ Success: {v2Data.success ? 'Yes' : 'No'}</div>
                                        <div>📊 Total: {v2Data.data?.pagination?.total || 0}</div>
                                        <div>💰 Total Paid: {formatCurrency(v2Data.data?.summary?.totalPaid || 0)}</div>
                                        <div>🔄 Source: {v2Data.source || 'v2-billing-service'}</div>
                                    </div>
                                </div>
                                
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {v2Data.data?.payments?.map((payment: Payment) => 
                                        renderPaymentCard(payment, 'v2')
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-500 text-center py-8">
                                Chưa có dữ liệu V2
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Comparison Summary */}
            {v1Data && v2Data && (
                <Card>
                    <CardHeader>
                        <CardTitle>📊 So sánh kết quả V1 vs V2</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-6 text-sm">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <div className="font-semibold text-blue-700 mb-2">🔵 V1 (Direct Database)</div>
                                <div>📊 Total Payments: {v1Data.data?.payments?.length || 0}</div>
                                <div>🏥 With Medical Records: {v1Data.data?.payments?.filter((p: Payment) => p.medical_records)?.length || 0}</div>
                                <div>❌ Without Medical Records: {v1Data.data?.payments?.filter((p: Payment) => !p.medical_records)?.length || 0}</div>
                                <div>🔄 Source: {v1Data.source || 'v1-direct'}</div>
                                <div>💰 Total Amount: {formatCurrency(v1Data.data?.summary?.totalPaid || 0)}</div>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg">
                                <div className="font-semibold text-green-700 mb-2">🟢 V2 (Billing Service)</div>
                                <div>📊 Total Payments: {v2Data.data?.payments?.length || 0}</div>
                                <div>🏥 With Medical Records: {v2Data.data?.payments?.filter((p: Payment) => p.medical_records)?.length || 0}</div>
                                <div>❌ Without Medical Records: {v2Data.data?.payments?.filter((p: Payment) => !p.medical_records)?.length || 0}</div>
                                <div>🔄 Source: {v2Data.source || 'v2-billing-service'}</div>
                                <div>💰 Total Amount: {formatCurrency(v2Data.data?.summary?.totalPaid || 0)}</div>
                            </div>
                        </div>

                        {/* Detailed Analysis */}
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <div className="font-semibold mb-2">🔍 Phân tích chi tiết:</div>
                            <div className="text-xs space-y-1">
                                <div>• V1 và V2 nên có cùng số lượng payments</div>
                                <div>• V2 nên có nhiều medical records hơn nhờ tích hợp billing service</div>
                                <div>• Nếu V2 fallback về direct DB, source sẽ hiển thị "direct-database-fallback"</div>
                                <div>• Medical records chỉ hiển thị cho payments có record_id</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
