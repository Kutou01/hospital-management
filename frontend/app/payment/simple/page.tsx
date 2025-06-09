'use client';

import React, { useState } from 'react';
import { Button, Card, Input, message, Spin } from 'antd';
import axios from 'axios';
import Image from 'next/image';

export default function SimplePaymentPage() {
    const [amount, setAmount] = useState<number>(100000);
    const [description, setDescription] = useState<string>('Thanh toán khám bệnh');
    const [loading, setLoading] = useState<boolean>(false);
    const [paymentData, setPaymentData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        setAmount(isNaN(value) ? 0 : value);
    };

    const handleSubmit = async () => {
        if (amount <= 0) {
            message.error('Vui lòng nhập số tiền hợp lệ');
            return;
        }

        setLoading(true);
        setError(null);
        setPaymentData(null);

        try {
            console.log('Đang gửi yêu cầu thanh toán...');
            const response = await axios.post('/api/payments/create', {
                amount: amount,
                description: description,
                doctorName: 'Nguyễn Văn A'  // Mẫu, thay bằng dữ liệu thực tế khi cần
            });

            console.log('Kết quả:', response.data);

            if (response.data.success) {
                setPaymentData(response.data.data);
                message.success('Đã tạo yêu cầu thanh toán thành công!');
            } else {
                setError(response.data.message || 'Lỗi không xác định khi tạo thanh toán');
                message.error('Không thể tạo thanh toán: ' + response.data.message);
            }
        } catch (error: any) {
            console.error('Lỗi thanh toán:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Lỗi kết nối đến máy chủ';
            setError(errorMsg);
            message.error('Lỗi: ' + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenPayment = () => {
        if (paymentData?.checkoutUrl) {
            window.open(paymentData.checkoutUrl, '_blank');
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Thanh toán đơn giản</h1>

            <Card title="Thông tin thanh toán" className="mb-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Số tiền (VNĐ)</label>
                    <Input
                        type="number"
                        value={amount}
                        onChange={handleAmountChange}
                        min={1000}
                        step={1000}
                        className="w-full"
                        placeholder="Nhập số tiền thanh toán"
                        disabled={loading}
                        addonAfter="VNĐ"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Mô tả</label>
                    <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full"
                        placeholder="Nhập mô tả thanh toán"
                        disabled={loading}
                    />
                </div>

                <Button
                    type="primary"
                    onClick={handleSubmit}
                    loading={loading}
                    className="w-full"
                >
                    Tạo yêu cầu thanh toán
                </Button>
            </Card>

            {loading && (
                <div className="text-center p-6">
                    <Spin size="large" />
                    <p className="mt-3">Đang kết nối đến cổng thanh toán...</p>
                </div>
            )}

            {error && (
                <Card className="mb-6 bg-red-50">
                    <div className="text-red-600">
                        <h3 className="font-bold mb-2">Lỗi thanh toán</h3>
                        <p>{error}</p>
                    </div>
                </Card>
            )}

            {paymentData && (
                <Card title="Thông tin thanh toán đã tạo" className="mb-6 bg-green-50">
                    <div className="mb-4">
                        <p><strong>Mã đơn hàng:</strong> {paymentData.orderCode}</p>
                        <p><strong>Số tiền:</strong> {paymentData.amount.toLocaleString()} VNĐ</p>
                        <p><strong>Mô tả:</strong> {paymentData.description}</p>
                    </div>

                    {paymentData.qrCode && (
                        <div className="mb-4 text-center">
                            <h3 className="text-lg font-medium mb-2">Quét mã QR để thanh toán</h3>
                            <div className="inline-block border p-2 bg-white">
                                <img
                                    src={paymentData.qrCode}
                                    alt="QR Code thanh toán"
                                    width={200}
                                    height={200}
                                    className="mx-auto"
                                />
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                                Sử dụng ứng dụng ngân hàng để quét mã QR và thanh toán
                            </p>
                        </div>
                    )}

                    <div className="flex justify-center">
                        <Button
                            type="primary"
                            onClick={handleOpenPayment}
                            className="w-full"
                            size="large"
                        >
                            Mở trang thanh toán
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
} 