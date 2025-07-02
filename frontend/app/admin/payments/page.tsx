'use client';

import React, { useState, useEffect } from 'react';
import { AdminPageWrapper } from '../page-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Receipt,
  Banknote,
  Wallet,
  PieChart,
  BarChart3,
  FileText,
  Eye
} from 'lucide-react';

interface Payment {
  id: string;
  patient_name: string;
  patient_id: string;
  amount: number;
  method: 'cash' | 'card' | 'transfer' | 'insurance';
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  type: 'consultation' | 'treatment' | 'medication' | 'surgery' | 'test';
  date: string;
  reference_number: string;
  description: string;
  doctor_name?: string;
  department?: string;
}

interface PaymentStats {
  totalRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
  pendingAmount: number;
  completedToday: number;
  failedToday: number;
  byMethod: {
    cash: number;
    card: number;
    transfer: number;
    insurance: number;
  };
  byStatus: {
    completed: number;
    pending: number;
    failed: number;
    refunded: number;
  };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('today');

  // Mock data
  const mockPayments: Payment[] = [
    {
      id: 'PAY-001',
      patient_name: 'Nguyễn Văn A',
      patient_id: 'PAT-202401-001',
      amount: 500000,
      method: 'card',
      status: 'completed',
      type: 'consultation',
      date: '2024-01-15T10:30:00Z',
      reference_number: 'REF-001-2024',
      description: 'Khám tổng quát',
      doctor_name: 'BS. Trần Thị B',
      department: 'Nội khoa'
    },
    {
      id: 'PAY-002',
      patient_name: 'Lê Thị C',
      patient_id: 'PAT-202401-002',
      amount: 1200000,
      method: 'insurance',
      status: 'pending',
      type: 'treatment',
      date: '2024-01-15T11:15:00Z',
      reference_number: 'REF-002-2024',
      description: 'Điều trị nội trú',
      doctor_name: 'BS. Phạm Văn D',
      department: 'Tim mạch'
    },
    {
      id: 'PAY-003',
      patient_name: 'Hoàng Văn E',
      patient_id: 'PAT-202401-003',
      amount: 300000,
      method: 'cash',
      status: 'completed',
      type: 'medication',
      date: '2024-01-15T14:20:00Z',
      reference_number: 'REF-003-2024',
      description: 'Thuốc điều trị',
      department: 'Dược'
    },
    {
      id: 'PAY-004',
      patient_name: 'Trần Thị F',
      patient_id: 'PAT-202401-004',
      amount: 800000,
      method: 'transfer',
      status: 'failed',
      type: 'test',
      date: '2024-01-15T16:45:00Z',
      reference_number: 'REF-004-2024',
      description: 'Xét nghiệm máu',
      department: 'Xét nghiệm'
    },
    {
      id: 'PAY-005',
      patient_name: 'Vũ Văn G',
      patient_id: 'PAT-202401-005',
      amount: 2500000,
      method: 'card',
      status: 'completed',
      type: 'surgery',
      date: '2024-01-14T09:00:00Z',
      reference_number: 'REF-005-2024',
      description: 'Phẫu thuật nhỏ',
      doctor_name: 'BS. Nguyễn Thị H',
      department: 'Ngoại khoa'
    }
  ];

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, statusFilter, methodFilter, dateFilter]);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPayments(mockPayments);
      calculateStats(mockPayments);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (paymentList: Payment[]) => {
    const stats: PaymentStats = {
      totalRevenue: paymentList.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
      totalTransactions: paymentList.length,
      averageTransaction: paymentList.length > 0 ? paymentList.reduce((sum, p) => sum + p.amount, 0) / paymentList.length : 0,
      pendingAmount: paymentList.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
      completedToday: paymentList.filter(p => p.status === 'completed' && isToday(p.date)).length,
      failedToday: paymentList.filter(p => p.status === 'failed' && isToday(p.date)).length,
      byMethod: {
        cash: paymentList.filter(p => p.method === 'cash').length,
        card: paymentList.filter(p => p.method === 'card').length,
        transfer: paymentList.filter(p => p.method === 'transfer').length,
        insurance: paymentList.filter(p => p.method === 'insurance').length,
      },
      byStatus: {
        completed: paymentList.filter(p => p.status === 'completed').length,
        pending: paymentList.filter(p => p.status === 'pending').length,
        failed: paymentList.filter(p => p.status === 'failed').length,
        refunded: paymentList.filter(p => p.status === 'refunded').length,
      }
    };
    setStats(stats);
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    return date.toDateString() === today.toDateString();
  };

  const filterPayments = () => {
    let filtered = payments;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    // Method filter
    if (methodFilter !== 'all') {
      filtered = filtered.filter(payment => payment.method === methodFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      if (dateFilter === 'today') {
        filtered = filtered.filter(payment => isToday(payment.date));
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(payment => new Date(payment.date) >= weekAgo);
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(payment => new Date(payment.date) >= monthAgo);
      }
    }

    setFilteredPayments(filtered);
  };

  const getStatusBadge = (status: Payment['status']) => {
    const variants = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };

    const labels = {
      completed: 'Hoàn thành',
      pending: 'Đang xử lý',
      failed: 'Thất bại',
      refunded: 'Hoàn tiền'
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getMethodBadge = (method: Payment['method']) => {
    const variants = {
      cash: 'bg-green-100 text-green-800',
      card: 'bg-blue-100 text-blue-800',
      transfer: 'bg-purple-100 text-purple-800',
      insurance: 'bg-orange-100 text-orange-800'
    };

    const labels = {
      cash: 'Tiền mặt',
      card: 'Thẻ',
      transfer: 'Chuyển khoản',
      insurance: 'Bảo hiểm'
    };

    return (
      <Badge className={variants[method]}>
        {labels[method]}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminPageWrapper
      title="Payment Management"
      activePage="payments"
      subtitle="Manage payments, transactions, and financial records"
      headerActions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={fetchPayments} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Payment Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.totalRevenue)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Transactions</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalTransactions}</p>
                  </div>
                  <Receipt className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Transaction</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(stats.averageTransaction)}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Amount</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(stats.pendingAmount)}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Tìm kiếm theo tên bệnh nhân, mã thanh toán..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="pending">Đang xử lý</SelectItem>
                  <SelectItem value="failed">Thất bại</SelectItem>
                  <SelectItem value="refunded">Hoàn tiền</SelectItem>
                </SelectContent>
              </Select>

              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Phương thức thanh toán" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả phương thức</SelectItem>
                  <SelectItem value="cash">Tiền mặt</SelectItem>
                  <SelectItem value="card">Thẻ</SelectItem>
                  <SelectItem value="transfer">Chuyển khoản</SelectItem>
                  <SelectItem value="insurance">Bảo hiểm</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Lọc theo thời gian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả thời gian</SelectItem>
                  <SelectItem value="today">Hôm nay</SelectItem>
                  <SelectItem value="week">7 ngày qua</SelectItem>
                  <SelectItem value="month">30 ngày qua</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payment Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Payment Methods Distribution */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-green-600" />
                      <span>Tiền mặt</span>
                    </div>
                    <span className="font-medium">{stats.byMethod.cash}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <span>Thẻ</span>
                    </div>
                    <span className="font-medium">{stats.byMethod.card}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-purple-600" />
                      <span>Chuyển khoản</span>
                    </div>
                    <span className="font-medium">{stats.byMethod.transfer}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-orange-600" />
                      <span>Bảo hiểm</span>
                    </div>
                    <span className="font-medium">{stats.byMethod.insurance}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Status Distribution */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Payment Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Hoàn thành</span>
                    </div>
                    <span className="font-medium">{stats.byStatus.completed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span>Đang xử lý</span>
                    </div>
                    <span className="font-medium">{stats.byStatus.pending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span>Thất bại</span>
                    </div>
                    <span className="font-medium">{stats.byStatus.failed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-gray-600" />
                      <span>Hoàn tiền</span>
                    </div>
                    <span className="font-medium">{stats.byStatus.refunded}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Recent Payments ({filteredPayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-blue-600" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{payment.patient_name}</h4>
                          {getStatusBadge(payment.status)}
                          {getMethodBadge(payment.method)}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>ID: {payment.patient_id}</span>
                          <span>Ref: {payment.reference_number}</span>
                          <span>{payment.description}</span>
                          {payment.doctor_name && <span>BS: {payment.doctor_name}</span>}
                          {payment.department && <span>{payment.department}</span>}
                        </div>

                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(payment.date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-gray-500">{payment.type}</p>
                      </div>

                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {filteredPayments.length === 0 && !isLoading && (
                  <div className="text-center py-8">
                    <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No payments found matching your criteria</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageWrapper>
  );
}
