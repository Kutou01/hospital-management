'use client';

import { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

interface ChartData {
    date: string;
    revenue: number;
    appointments: number;
}

interface RevenueChartProps {
    data: ChartData[];
    type?: 'line' | 'bar';
    height?: number;
}

export function RevenueChart({ data, type = 'line', height = 300 }: RevenueChartProps) {
    const [chartData, setChartData] = useState<ChartData[]>([]);

    useEffect(() => {
        // Format data for chart
        const formattedData = data.map(item => ({
            ...item,
            date: new Date(item.date).toLocaleDateString('vi-VN', { 
                month: 'short', 
                day: 'numeric' 
            }),
            revenueFormatted: item.revenue.toLocaleString('vi-VN')
        }));
        setChartData(formattedData);
    }, [data]);

    const formatCurrency = (value: number) => {
        return `${value.toLocaleString('vi-VN')} VNĐ`;
    };

    if (type === 'bar') {
        return (
            <ResponsiveContainer width="100%" height={height}>
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip 
                        formatter={(value: number, name: string) => [
                            name === 'revenue' ? formatCurrency(value) : value,
                            name === 'revenue' ? 'Doanh thu' : 'Lượt khám'
                        ]}
                        labelStyle={{ color: '#374151' }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3b82f6" name="Doanh thu" />
                    <Bar dataKey="appointments" fill="#10b981" name="Lượt khám" />
                </BarChart>
            </ResponsiveContainer>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip 
                    formatter={(value: number, name: string) => [
                        name === 'revenue' ? formatCurrency(value) : value,
                        name === 'revenue' ? 'Doanh thu' : 'Lượt khám'
                    ]}
                    labelStyle={{ color: '#374151' }}
                />
                <Legend />
                <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Doanh thu"
                />
                <Line 
                    type="monotone" 
                    dataKey="appointments" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Lượt khám"
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

interface RevenueDistributionProps {
    data: { name: string; value: number; color: string }[];
    height?: number;
}

export function RevenueDistributionChart({ data, height = 300 }: RevenueDistributionProps) {
    const formatCurrency = (value: number) => {
        return `${value.toLocaleString('vi-VN')} VNĐ`;
    };

    return (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}

interface StatCardProps {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    color?: 'blue' | 'green' | 'yellow' | 'red';
}

export function StatCard({ title, value, change, icon, color = 'blue' }: StatCardProps) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 border-blue-200',
        green: 'bg-green-50 text-green-600 border-green-200',
        yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
        red: 'bg-red-50 text-red-600 border-red-200'
    };

    return (
        <div className="bg-white rounded-lg border p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    {change !== undefined && (
                        <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {change >= 0 ? '+' : ''}{change}% so với tháng trước
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
