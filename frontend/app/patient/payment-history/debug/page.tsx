'use client';

import React from 'react';
import AuthDebugger from '../debug';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function DebugPage() {
    const router = useRouter();

    return (
        <div className="container mx-auto py-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Kiểm tra lỗi lịch sử thanh toán</CardTitle>
                    <CardDescription>
                        Công cụ này giúp xác định nguyên nhân của lỗi "Không tìm thấy thông tin người dùng"
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <Button
                            onClick={() => router.push('/patient/payment-history')}
                            variant="outline"
                        >
                            Quay lại lịch sử thanh toán
                        </Button>
                    </div>

                    <AuthDebugger />
                </CardContent>
            </Card>
        </div>
    );
}