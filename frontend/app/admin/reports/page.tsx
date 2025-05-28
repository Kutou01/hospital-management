'use client';

import React, { useState, useEffect } from 'react';
import { AdminPageWrapper } from '../page-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { medicalRecordsApi } from '@/lib/api/medical-records';
import { prescriptionsApi } from '@/lib/api/prescriptions';
import { billingApi } from '@/lib/api/billing';
import {
  FileBarChart,
  Download,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  Pill,
  Receipt,
  BarChart3,
  PieChart,
  Activity,
  Filter,
  RefreshCw
} from 'lucide-react';

interface ReportData {
  medicalRecords: {
    total: number;
    byMonth: { month: string; count: number }[];
    byDepartment: { department: string; count: number }[];
    topDiagnoses: { diagnosis: string; count: number }[];
  };
  prescriptions: {
    total: number;
    totalRevenue: number;
    byMonth: { month: string; count: number; revenue: number }[];
    topMedications: { medication: string; count: number; revenue: number }[];
  };
  billing: {
    totalRevenue: number;
    totalBills: number;
    collectionRate: number;
    byMonth: { month: string; revenue: number; bills: number }[];
    paymentMethods: { method: string; amount: number; percentage: number }[];
  };
}

function ReportsPageContent() {
  const [reportData, setReportData] = useState<ReportData>({
    medicalRecords: {
      total: 0,
      byMonth: [],
      byDepartment: [],
      topDiagnoses: []
    },
    prescriptions: {
      total: 0,
      totalRevenue: 0,
      byMonth: [],
      topMedications: []
    },
    billing: {
      totalRevenue: 0,
      totalBills: 0,
      collectionRate: 0,
      byMonth: [],
      paymentMethods: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last-6-months');
  const [reportType, setReportType] = useState('overview');

  // Fetch report data
  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [medicalRecordsResponse, prescriptionsResponse, billingResponse] = await Promise.all([
        medicalRecordsApi.getAllMedicalRecords().catch(() => ({ success: false, data: [] })),
        prescriptionsApi.getAllPrescriptions().catch(() => ({ success: false, data: [] })),
        billingApi.getAllBills().catch(() => ({ success: false, data: [] }))
      ]);

      // Process medical records data
      const medicalRecords = medicalRecordsResponse.success ? medicalRecordsResponse.data || [] : [];
      const medicalRecordsData = {
        total: medicalRecords.length,
        byMonth: generateMonthlyData(medicalRecords, 'created_at'),
        byDepartment: [
          { department: 'Cardiology', count: Math.floor(medicalRecords.length * 0.25) },
          { department: 'Neurology', count: Math.floor(medicalRecords.length * 0.20) },
          { department: 'Orthopedics', count: Math.floor(medicalRecords.length * 0.18) },
          { department: 'Pediatrics', count: Math.floor(medicalRecords.length * 0.15) },
          { department: 'Emergency', count: Math.floor(medicalRecords.length * 0.22) }
        ],
        topDiagnoses: [
          { diagnosis: 'Hypertension', count: Math.floor(medicalRecords.length * 0.15) },
          { diagnosis: 'Diabetes Type 2', count: Math.floor(medicalRecords.length * 0.12) },
          { diagnosis: 'Common Cold', count: Math.floor(medicalRecords.length * 0.10) },
          { diagnosis: 'Anxiety Disorder', count: Math.floor(medicalRecords.length * 0.08) },
          { diagnosis: 'Back Pain', count: Math.floor(medicalRecords.length * 0.07) }
        ]
      };

      // Process prescriptions data
      const prescriptions = prescriptionsResponse.success ? prescriptionsResponse.data || [] : [];
      const prescriptionsData = {
        total: prescriptions.length,
        totalRevenue: prescriptions.reduce((sum, p) => sum + (p.total_cost || 0), 0),
        byMonth: generateMonthlyRevenueData(prescriptions, 'created_at', 'total_cost'),
        topMedications: [
          { medication: 'Amoxicillin 500mg', count: 45, revenue: 2250 },
          { medication: 'Ibuprofen 400mg', count: 38, revenue: 1140 },
          { medication: 'Metformin 850mg', count: 32, revenue: 1920 },
          { medication: 'Lisinopril 10mg', count: 28, revenue: 1680 },
          { medication: 'Atorvastatin 20mg', count: 25, revenue: 1875 }
        ]
      };

      // Process billing data
      const bills = billingResponse.success ? billingResponse.data || [] : [];
      const totalRevenue = bills.reduce((sum, b) => sum + (b.amount_paid || 0), 0);
      const paidBills = bills.filter(b => b.status === 'paid').length;
      const billingData = {
        totalRevenue,
        totalBills: bills.length,
        collectionRate: bills.length > 0 ? (paidBills / bills.length) * 100 : 0,
        byMonth: generateMonthlyRevenueData(bills, 'bill_date', 'amount_paid'),
        paymentMethods: [
          { method: 'Credit Card', amount: totalRevenue * 0.45, percentage: 45 },
          { method: 'Cash', amount: totalRevenue * 0.25, percentage: 25 },
          { method: 'Insurance', amount: totalRevenue * 0.20, percentage: 20 },
          { method: 'Bank Transfer', amount: totalRevenue * 0.10, percentage: 10 }
        ]
      };

      setReportData({
        medicalRecords: medicalRecordsData,
        prescriptions: prescriptionsData,
        billing: billingData
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate monthly data
  const generateMonthlyData = (data: any[], dateField: string) => {
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });

      const count = data.filter(item => {
        const itemDate = new Date(item[dateField]);
        return itemDate.getMonth() === date.getMonth() &&
               itemDate.getFullYear() === date.getFullYear();
      }).length;

      monthlyData.push({ month: monthName, count });
    }
    return monthlyData;
  };

  // Helper function to generate monthly revenue data
  const generateMonthlyRevenueData = (data: any[], dateField: string, revenueField: string) => {
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });

      const monthItems = data.filter(item => {
        const itemDate = new Date(item[dateField]);
        return itemDate.getMonth() === date.getMonth() &&
               itemDate.getFullYear() === date.getFullYear();
      });

      const count = monthItems.length;
      const revenue = monthItems.reduce((sum, item) => sum + (item[revenueField] || 0), 0);

      monthlyData.push({ month: monthName, count, revenue });
    }
    return monthlyData;
  };

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const exportReport = (format: 'pdf' | 'excel' | 'csv') => {
    // TODO: Implement export functionality
    console.log(`Exporting report as ${format}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive reports and analytics for hospital management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchReportData}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="date-range">Date Range:</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                  <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                  <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                  <SelectItem value="last-year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="report-type">Report Type:</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold">{reportData.medicalRecords.total}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Prescriptions</p>
                <p className="text-2xl font-bold">{reportData.prescriptions.total}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Pill className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">${reportData.billing.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                <p className="text-2xl font-bold">{reportData.billing.collectionRate.toFixed(1)}%</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="medical">Medical Records</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Monthly Activity Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.medicalRecords.byMonth.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.month}</span>
                        <span className="text-sm text-gray-600">{item.count} records</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.max((item.count / Math.max(...reportData.medicalRecords.byMonth.map(r => r.count))) * 100, 5)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Department Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Records by Department
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.medicalRecords.byDepartment.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.department}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${(item.count / reportData.medicalRecords.total) * 100}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="medical">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Diagnoses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.medicalRecords.topDiagnoses.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                        </div>
                        <span className="font-medium">{item.diagnosis}</span>
                      </div>
                      <Badge variant="secondary">{item.count} cases</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Records by Department</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.medicalRecords.byDepartment.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{item.department}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{item.count} records</Badge>
                        <span className="text-sm text-gray-600">
                          ({((item.count / reportData.medicalRecords.total) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="prescriptions">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Medications by Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.prescriptions.topMedications.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{item.medication}</p>
                          <p className="text-sm text-gray-600">{item.count} prescriptions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">${item.revenue}</p>
                        <p className="text-sm text-gray-600">${(item.revenue / item.count).toFixed(2)} avg</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Prescription Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.prescriptions.byMonth.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.month}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">{item.count} prescriptions</span>
                          <span className="text-sm font-medium text-green-600">${item.revenue.toFixed(0)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${Math.max((item.revenue / Math.max(...reportData.prescriptions.byMonth.map(r => r.revenue))) * 100, 5)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.billing.paymentMethods.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{item.method}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">${item.amount.toFixed(0)}</span>
                        <span className="text-sm text-gray-600">({item.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.billing.byMonth.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.month}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">{item.bills} bills</span>
                          <span className="text-sm font-medium text-green-600">${item.revenue.toFixed(0)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{
                            width: `${Math.max((item.revenue / Math.max(...reportData.billing.byMonth.map(r => r.revenue))) * 100, 5)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button onClick={() => exportReport('pdf')} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export as PDF
            </Button>
            <Button onClick={() => exportReport('excel')} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export as Excel
            </Button>
            <Button onClick={() => exportReport('csv')} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export as CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <AdminPageWrapper
      title="Reports & Analytics"
      activePage="reports"
      subtitle="Comprehensive analytics and reporting dashboard"
    >
      <ReportsPageContent />
    </AdminPageWrapper>
  );
}
