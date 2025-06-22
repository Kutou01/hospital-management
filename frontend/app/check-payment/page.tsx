'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Payment {
    id: string;
    order_code: string;
    amount: number;
    description: string;
    status: string;
    payment_method: string;
    created_at: string;
    paid_at?: string;
    doctor_name?: string;
}

interface PaymentData {
    all_payments: Payment[];
    payments_300k: Payment[];
    payment_stats: {
        total: number;
        status_counts: Record<string, number>;
        recent_amounts: Array<{
            amount: number;
            status: string;
            created_at: string;
        }>;
    };
}

export default function CheckPaymentPage() {
    const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchAmount, setSearchAmount] = useState('300000');

    const fetchPayments = async (amount?: string) => {
        setLoading(true);
        try {
            const url = amount 
                ? `/api/check-payments?amount=${amount}`
                : '/api/check-payments';
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                setPaymentData(data.data);
            } else {
                console.error('Failed to fetch payments:', data.error);
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments(searchAmount);
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
            case 'paid':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-600" />;
            case 'pending':
                return <Clock className="h-4 w-4 text-yellow-600" />;
            default:
                return <Clock className="h-4 w-4 text-gray-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN');
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Kiểm tra thanh toán</h1>
                <p className="text-gray-600">Tìm kiếm và kiểm tra trạng thái thanh toán</p>
            </div>

            {/* Search Section */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Tìm kiếm thanh toán
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <Input
                            placeholder="Nhập số tiền (VD: 300000)"
                            value={searchAmount}
                            onChange={(e) => setSearchAmount(e.target.value)}
                            className="flex-1"
                        />
                        <Button 
                            onClick={() => fetchPayments(searchAmount)}
                            disabled={loading}
                        >
                            {loading ? (
                                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Search className="h-4 w-4 mr-2" />
                            )}
                            Tìm kiếm
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={() => fetchPayments()}
                            disabled={loading}
                        >
                            Tất cả
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {paymentData && (
                <>
                    {/* Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardContent className="p-4">
                                <div className="text-2xl font-bold">{paymentData.payment_stats.total}</div>
                                <div className="text-sm text-gray-600">Tổng thanh toán</div>
                            </CardContent>
                        </Card>
                        {Object.entries(paymentData.payment_stats.status_counts).map(([status, count]) => (
                            <Card key={status}>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(status)}
                                        <div className="text-2xl font-bold">{count}</div>
                                    </div>
                                    <div className="text-sm text-gray-600 capitalize">{status}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Payments 300k */}
                    {paymentData.payments_300k.length > 0 && (
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="text-green-600">
                                    Thanh toán 300,000 VND ({paymentData.payments_300k.length} giao dịch)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {paymentData.payments_300k.map((payment) => (
                                        <div key={payment.id} className="border rounded-lg p-4 bg-green-50">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-semibold">{payment.order_code}</div>
                                                    <div className="text-sm text-gray-600">{payment.description}</div>
                                                    {payment.doctor_name && (
                                                        <div className="text-sm text-blue-600">Bác sĩ: {payment.doctor_name}</div>
                                                    )}
                                                </div>
                                                <Badge className={getStatusColor(payment.status)}>
                                                    {getStatusIcon(payment.status)}
                                                    <span className="ml-1">{payment.status}</span>
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Số tiền:</span>
                                                    <div className="font-semibold text-green-600">
                                                        {formatCurrency(payment.amount)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Phương thức:</span>
                                                    <div>{payment.payment_method}</div>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Tạo lúc:</span>
                                                    <div>{formatDate(payment.created_at)}</div>
                                                </div>
                                                {payment.paid_at && (
                                                    <div>
                                                        <span className="text-gray-500">Thanh toán lúc:</span>
                                                        <div>{formatDate(payment.paid_at)}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* All Payments */}
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Tất cả thanh toán ({paymentData.all_payments.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {paymentData.all_payments.map((payment) => (
                                    <div key={payment.id} className="border rounded-lg p-3">
                                        <div className="flex justify-between items-center">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold">{payment.order_code}</span>
                                                    <Badge className={getStatusColor(payment.status)}>
                                                        {payment.status}
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-gray-600">{payment.description}</div>
                                                <div className="text-xs text-gray-500">
                                                    {formatDate(payment.created_at)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-lg">
                                                    {formatCurrency(payment.amount)}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {payment.payment_method}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
