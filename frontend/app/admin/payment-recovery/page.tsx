'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, RefreshCw } from "lucide-react";

// Tạo các component bảng đơn giản không phụ thuộc vào thư viện
const Table = ({ children }: { children: React.ReactNode }) => (
    <table className="min-w-full divide-y divide-gray-200">{children}</table>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
    <thead className="bg-gray-50">{children}</thead>
);

const TableBody = ({ children }: { children: React.ReactNode }) => (
    <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
);

const TableRow = ({ children }: { children: React.ReactNode }) => (
    <tr>{children}</tr>
);

const TableHead = ({ children }: { children: React.ReactNode }) => (
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{children}</th>
);

const TableCell = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <td className={`px-6 py-4 whitespace-nowrap ${className}`}>{children}</td>
);

// Component Badge
const Badge = ({ children, variant, className = "" }: { children: React.ReactNode, variant?: string, className?: string }) => (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${className}`}>{children}</span>
);

// Component LoadingSpinner
const LoadingSpinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
    const sizeClass = {
        sm: "h-4 w-4",
        md: "h-8 w-8",
        lg: "h-12 w-12"
    };

    return (
        <div className="flex justify-center items-center">
            <RefreshCw className={`${sizeClass[size]} animate-spin text-gray-500`} />
        </div>
    );
};

// Định nghĩa interface cho dữ liệu thanh toán
interface PaymentResult {
    id: number;
    order_code: string;
    status: string;
    patient_id?: string;
    source?: string;
    message?: string;
}

interface RecoveryResults {
    total: number;
    recovered: number;
    results: PaymentResult[];
}

export default function PaymentRecoveryPage() {
    const [loading, setLoading] = useState<boolean>(false);
    const [checkingStatus, setCheckingStatus] = useState<boolean>(false);
    const [missingCount, setMissingCount] = useState<number | null>(null);
    const [recoveryResults, setRecoveryResults] = useState<RecoveryResults | null>(null);
    const [activeTab, setActiveTab] = useState<string>('dashboard');
    const [error, setError] = useState<string | null>(null);

    // Mock data for development without actual API
    const mockMissingCount = 5;
    const mockRecoveryResults: RecoveryResults = {
        total: 5,
        recovered: 3,
        results: [
            { id: 1, order_code: 'ORD123', status: 'recovered', patient_id: 'PAT001', source: 'description' },
            { id: 2, order_code: 'ORD124', status: 'recovered', patient_id: 'PAT002', source: 'medical_records' },
            { id: 3, order_code: 'ORD125', status: 'recovered', patient_id: 'PAT003', source: 'appointments' },
            { id: 4, order_code: 'ORD126', status: 'not_found', message: 'Could not find related patient_id' },
            { id: 5, order_code: 'ORD127', status: 'error', message: 'Database error' }
        ]
    };

    // Kiểm tra số lượng thanh toán cần khôi phục
    const checkMissingPayments = async () => {
        try {
            setCheckingStatus(true);
            setError(null);

            // Sử dụng dữ liệu mẫu nếu không có API thực tế
            if (process.env.NODE_ENV === 'development') {
                // Giả lập một khoảng thời gian xử lý
                await new Promise(resolve => setTimeout(resolve, 1000));
                setMissingCount(mockMissingCount);
            } else {
                // Gọi API thực tế
                const response = await fetch('/api/payment/recover-missing');
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Could not check missing payments');
                }

                setMissingCount(data.missing_count || 0);
            }

        } catch (err) {
            console.error('Error checking missing payments:', err);
            setError(err instanceof Error ? err.message : 'Failed to check missing payments');
        } finally {
            setCheckingStatus(false);
        }
    };

    // Chạy quá trình khôi phục
    const runRecoveryProcess = async () => {
        try {
            setLoading(true);
            setError(null);
            setActiveTab('results');

            // Sử dụng dữ liệu mẫu nếu không có API thực tế
            if (process.env.NODE_ENV === 'development') {
                // Giả lập một khoảng thời gian xử lý
                await new Promise(resolve => setTimeout(resolve, 2000));
                setRecoveryResults(mockRecoveryResults);
            } else {
                // Gọi API thực tế
                const response = await fetch('/api/payment/recover-missing', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Recovery process failed');
                }

                const recoveryData = data.data || { total: 0, recovered: 0, results: [] };
                setRecoveryResults(recoveryData as RecoveryResults);
            }

            // Kiểm tra lại số lượng
            await checkMissingPayments();

        } catch (err) {
            console.error('Error running recovery process:', err);
            setError(err instanceof Error ? err.message : 'Recovery process failed');
        } finally {
            setLoading(false);
        }
    };

    // Kiểm tra trạng thái khi trang được tải
    useEffect(() => {
        checkMissingPayments();
    }, []);

    return (
        <div className="container mx-auto p-4 max-w-7xl">
            <h1 className="text-3xl font-bold mb-2">Payment Recovery Tool</h1>
            <p className="text-gray-500 mb-6">Repair and recover payments with missing patient_id information</p>

            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="results">Recovery Results</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Missing Patient Payments</CardTitle>
                            <CardDescription>Payments in database without patient_id information</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center text-center">
                            <div className="bg-amber-50 rounded-full p-8 mb-4">
                                <AlertTriangle className="h-12 w-12 text-amber-500" />
                            </div>

                            {checkingStatus ? (
                                <LoadingSpinner />
                            ) : (
                                <>
                                    <h2 className="text-4xl font-bold mb-1">
                                        {missingCount !== null ? missingCount : '?'}
                                    </h2>
                                    <p className="text-gray-500 mb-6">payments need recovery</p>
                                </>
                            )}

                            <Button
                                onClick={runRecoveryProcess}
                                disabled={loading || checkingStatus || (missingCount !== null && missingCount === 0)}
                                className="w-full max-w-sm"
                            >
                                {loading ? <LoadingSpinner size="sm" /> : 'Run Recovery Process'}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>How Recovery Works</CardTitle>
                            <CardDescription>This tool attempts to recover payments missing patient_id information by:</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ol className="list-decimal list-inside space-y-2 pl-4">
                                <li>Checking related medical records if record_id exists</li>
                                <li>Searching the appointments table for matching payment references</li>
                                <li>Analyzing payment descriptions for patient identifiers</li>
                                <li>Updating the payment records with the recovered information</li>
                            </ol>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="results">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Recovery Results</CardTitle>
                                    <CardDescription>
                                        {recoveryResults ? `${recoveryResults.recovered} of ${recoveryResults.total} payments recovered` : 'No recovery has been run yet'}
                                    </CardDescription>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={checkMissingPayments}
                                    disabled={checkingStatus}
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {!recoveryResults ? (
                                <div className="text-center py-8">
                                    <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                    <p>No recovery process has been run yet</p>
                                    <Button onClick={runRecoveryProcess} className="mt-4" disabled={loading}>
                                        Run Recovery Process
                                    </Button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Order Code</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Patient ID</TableHead>
                                                <TableHead>Source</TableHead>
                                                <TableHead>Message</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recoveryResults.results.map((result) => (
                                                <TableRow key={result.id}>
                                                    <TableCell className="font-medium">{result.order_code}</TableCell>
                                                    <TableCell>
                                                        {result.status === 'recovered' && (
                                                            <Badge variant="success" className="bg-green-100 text-green-800">
                                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                Recovered
                                                            </Badge>
                                                        )}
                                                        {result.status === 'not_found' && (
                                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                                Not Found
                                                            </Badge>
                                                        )}
                                                        {result.status === 'error' && (
                                                            <Badge variant="destructive" className="bg-red-100 text-red-700">
                                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                                Error
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{result.patient_id || '-'}</TableCell>
                                                    <TableCell>{result.source || '-'}</TableCell>
                                                    <TableCell className="text-sm text-gray-500">
                                                        {result.message || (result.status === 'recovered' ? `Recovered from ${result.source}` : '-')}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 