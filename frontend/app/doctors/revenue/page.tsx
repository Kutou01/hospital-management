'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RevenueChart, RevenueDistributionChart, StatCard } from '@/components/charts/RevenueChart';
import { DoctorLayout } from '@/components/layout/UniversalLayout';
import {
    TrendingUp,
    Users,
    Calendar,
    DollarSign,
    Download,
    BarChart3,
    PieChart,
    Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface RevenueData {
    doctor: {
        id: string;
        name: string;
        specialty: string;
        consultation_fee: number;
    };
    summary: {
        totalRevenue: number;
        totalPatients: number;
        totalAppointments: number;
        averagePerAppointment: number;
        period: string;
    };
    chartData: Array<{
        date: string;
        revenue: number;
        appointments: number;
    }>;
    topDiagnoses: Array<{
        diagnosis: string;
        count: number;
    }>;
    recentPayments: Array<{
        id: string;
        orderCode: string;
        amount: number;
        date: string;
        patientId: string;
        diagnosis: string;
    }>;
}

export default function DoctorRevenuePage() {
    const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('month');
    const [doctorId, setDoctorId] = useState('DOC000001'); // This should come from auth context

    const fetchRevenueData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/doctors/revenue?doctorId=${doctorId}&period=${period}`);
            const data = await response.json();

            if (data.success) {
                setRevenueData(data.data);
            } else {
                console.error('Failed to fetch revenue data:', data.error);
            }
        } catch (error) {
            console.error('Error fetching revenue data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRevenueData();
    }, [period, doctorId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const getPeriodLabel = (period: string) => {
        const labels = {
            day: 'Hôm nay',
            week: 'Tuần này',
            month: 'Tháng này',
            year: 'Năm này'
        };
        return labels[period as keyof typeof labels] || period;
    };

    const exportReport = async () => {
        try {
            const response = await fetch(`/api/doctors/revenue/export?doctorId=${doctorId}&period=${period}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `revenue-report-${doctorId}-${period}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Error exporting report:', error);
        }
    };

    if (loading) {
        return (
            <DoctorLayout title="Dashboard Doanh thu" activePage="revenue">
                <div className="space-y-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="animate-pulse">
                            <div className="h-32 bg-gray-200 rounded-lg"></div>
                        </div>
                    ))}
                </div>
            </DoctorLayout>
        );
    }

    if (!revenueData) {
        return (
            <DoctorLayout title="Dashboard Doanh thu" activePage="revenue">
                <div className="text-center py-12">
                    <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Không có dữ liệu doanh thu</h3>
                    <p className="text-gray-600">Dữ liệu doanh thu sẽ hiển thị khi có giao dịch.</p>
                </div>
            </DoctorLayout>
        );
    }

    return (
        <DoctorLayout
            title="Dashboard Doanh thu"
            activePage="revenue"
            subtitle={`${revenueData.doctor.name} - ${revenueData.doctor.specialty}`}
            headerActions={
                <div className="flex items-center gap-4">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="day">Hôm nay</SelectItem>
                            <SelectItem value="week">Tuần này</SelectItem>
                            <SelectItem value="month">Tháng này</SelectItem>
                            <SelectItem value="year">Năm này</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={exportReport} className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Xuất báo cáo
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatCurrency(revenueData.summary.totalRevenue)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{getPeriodLabel(period)}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <DollarSign className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Số bệnh nhân</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {revenueData.summary.totalPatients}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Bệnh nhân khác nhau</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Lượt khám</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {revenueData.summary.totalAppointments}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Cuộc hẹn hoàn thành</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-full">
                                <Calendar className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Trung bình/lượt</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {formatCurrency(revenueData.summary.averagePerAppointment)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Doanh thu trung bình</p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-full">
                                <TrendingUp className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Biểu đồ doanh thu theo ngày
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RevenueChart
                            data={revenueData.chartData}
                            type="line"
                            height={250}
                        />
                    </CardContent>
                </Card>

                {/* Top Diagnoses */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5" />
                            Chẩn đoán phổ biến
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {revenueData.topDiagnoses.map((item, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {item.diagnosis}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">{item.count}</Badge>
                                        <div className="w-16 bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{ 
                                                    width: `${(item.count / revenueData.topDiagnoses[0].count) * 100}%` 
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Payments */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Giao dịch gần đây
                        <Badge variant="secondary">{revenueData.recentPayments.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {revenueData.recentPayments.length === 0 ? (
                        <div className="text-center py-8">
                            <DollarSign className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600">Chưa có giao dịch nào</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {revenueData.recentPayments.map((payment) => (
                                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-medium text-gray-900">#{payment.orderCode}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {payment.patientId}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600">{payment.diagnosis}</p>
                                        <p className="text-xs text-gray-500">
                                            {format(new Date(payment.date), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600">
                                            {formatCurrency(payment.amount)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            </div>
        </DoctorLayout>
    );
}
