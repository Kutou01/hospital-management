'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';

interface ServiceFlowStep {
    service: string;
    status: 'pending' | 'success' | 'error' | 'fallback';
    data?: any;
    error?: string;
    duration?: number;
}

export default function TestServiceArchitecturePage() {
    const [loading, setLoading] = useState(false);
    const [serviceFlow, setServiceFlow] = useState<ServiceFlowStep[]>([]);
    const [finalResult, setFinalResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const testServiceArchitecture = async () => {
        setLoading(true);
        setError(null);
        setServiceFlow([]);
        setFinalResult(null);

        try {
            // Get auth token
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.access_token) {
                setError('Không tìm thấy session. Vui lòng đăng nhập lại.');
                return;
            }

            const headers = {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            };

            // Initialize service flow tracking
            const flow: ServiceFlowStep[] = [
                { service: 'Patient Service', status: 'pending' },
                { service: 'Billing Service', status: 'pending' },
                { service: 'Medical Records Service', status: 'pending' }
            ];
            setServiceFlow([...flow]);

            console.log('🚀 Starting service-to-service architecture test...');
            const startTime = Date.now();

            // Call V2 API which implements service-to-service architecture
            const response = await fetch('/api/patient/payment-history-v2?page=1&limit=5', {
                headers
            });

            const result = await response.json();
            const endTime = Date.now();
            const totalDuration = endTime - startTime;

            console.log('✅ Service-to-service test completed:', result);

            // Update service flow based on result
            if (result.success) {
                // Mark all services as successful
                const updatedFlow = flow.map(step => ({
                    ...step,
                    status: 'success' as const,
                    duration: Math.floor(totalDuration / 3) // Approximate
                }));
                setServiceFlow(updatedFlow);
                setFinalResult(result);
            } else {
                // Mark as error
                const updatedFlow = flow.map(step => ({
                    ...step,
                    status: 'error' as const,
                    error: result.error
                }));
                setServiceFlow(updatedFlow);
                setError(result.error);
            }

        } catch (err) {
            console.error('❌ Service architecture test error:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
            
            // Mark all services as error
            const errorFlow = serviceFlow.map(step => ({
                ...step,
                status: 'error' as const,
                error: 'Service communication failed'
            }));
            setServiceFlow(errorFlow);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: ServiceFlowStep['status']) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'success': return 'bg-green-100 text-green-800';
            case 'error': return 'bg-red-100 text-red-800';
            case 'fallback': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: ServiceFlowStep['status']) => {
        switch (status) {
            case 'pending': return '⏳';
            case 'success': return '✅';
            case 'error': return '❌';
            case 'fallback': return '🔄';
            default: return '⚪';
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold mb-4">🏗️ Test Service-to-Service Architecture</h1>
                <p className="text-gray-600 mb-6">
                    Kiểm tra luồng: Patient Service → Billing Service → Medical Records Service
                </p>
                
                <Button
                    onClick={testServiceArchitecture}
                    disabled={loading}
                    className="mb-6"
                >
                    {loading ? '🔄 Testing...' : '🚀 Test Service Architecture'}
                </Button>
            </div>

            {error && (
                <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">
                        ❌ {error}
                    </AlertDescription>
                </Alert>
            )}

            {/* Service Flow Visualization */}
            <Card>
                <CardHeader>
                    <CardTitle>🔄 Service Communication Flow</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {serviceFlow.map((step, index) => (
                            <div key={step.service} className="flex items-center gap-4">
                                <div className="flex items-center gap-2 min-w-[200px]">
                                    <span className="text-2xl">{getStatusIcon(step.status)}</span>
                                    <span className="font-medium">{step.service}</span>
                                </div>
                                
                                <Badge className={getStatusColor(step.status)}>
                                    {step.status}
                                    {step.duration && ` (${step.duration}ms)`}
                                </Badge>
                                
                                {step.error && (
                                    <span className="text-red-600 text-sm">{step.error}</span>
                                )}
                                
                                {index < serviceFlow.length - 1 && (
                                    <span className="text-gray-400">→</span>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Architecture Diagram */}
            <Card>
                <CardHeader>
                    <CardTitle>📊 Architecture Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <div className="text-center space-y-4">
                            <div className="flex justify-center items-center gap-8">
                                <div className="bg-blue-100 p-4 rounded-lg">
                                    <div className="font-bold">👤 User Request</div>
                                    <div className="text-sm text-gray-600">Payment History</div>
                                </div>
                                <span className="text-2xl">→</span>
                                <div className="bg-green-100 p-4 rounded-lg">
                                    <div className="font-bold">🏥 Patient Service</div>
                                    <div className="text-sm text-gray-600">Get Patient Info</div>
                                </div>
                            </div>
                            
                            <div className="text-2xl">↓</div>
                            
                            <div className="bg-yellow-100 p-4 rounded-lg">
                                <div className="font-bold">💰 Billing Service</div>
                                <div className="text-sm text-gray-600">Get Payment History</div>
                            </div>
                            
                            <div className="text-2xl">↓</div>
                            
                            <div className="bg-purple-100 p-4 rounded-lg">
                                <div className="font-bold">📋 Medical Records Service</div>
                                <div className="text-sm text-gray-600">Get Invoice Details</div>
                            </div>
                            
                            <div className="text-2xl">↓</div>
                            
                            <div className="bg-orange-100 p-4 rounded-lg">
                                <div className="font-bold">📊 Combined Result</div>
                                <div className="text-sm text-gray-600">Payment + Medical Data</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Final Result */}
            {finalResult && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            ✅ Final Result
                            <Badge variant="outline">
                                {finalResult.data?.payments?.length || 0} payments
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <strong>Source:</strong> {finalResult.source}
                                </div>
                                <div>
                                    <strong>Patient ID:</strong> {finalResult.data?.patient?.patient_id}
                                </div>
                                <div>
                                    <strong>Total Payments:</strong> {finalResult.data?.payments?.length || 0}
                                </div>
                                <div>
                                    <strong>With Medical Records:</strong> {finalResult.data?.payments?.filter((p: any) => p.medical_record).length || 0}
                                </div>
                            </div>
                            
                            {finalResult.data?.service_flow && (
                                <div className="mt-4">
                                    <strong>Service Flow Status:</strong>
                                    <div className="flex gap-2 mt-2">
                                        {Object.entries(finalResult.data.service_flow).map(([service, status]) => (
                                            <Badge key={service} className="bg-green-100 text-green-800">
                                                {service}: {status as string}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <details className="mt-4">
                                <summary className="cursor-pointer font-medium">View Raw Data</summary>
                                <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                                    {JSON.stringify(finalResult, null, 2)}
                                </pre>
                            </details>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
