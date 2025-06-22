import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';

// Request deduplication cache
const requestCache = new Map<string, { timestamp: number; promise: Promise<any> }>();
const CACHE_DURATION = 5000; // 5 seconds

// Cấu hình thông tin PayOS - cần cập nhật các giá trị này trong file .env
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID;
const PAYOS_API_KEY = process.env.PAYOS_API_KEY;
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY;
const PAYOS_API_URL = process.env.PAYOS_API_URL || 'https://api-merchant.payos.vn';
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
    try {
        console.log('Payment checkout API route called');

        // Parse request body
        const body = await request.json();
        const { amount, description, doctorId, doctorName, patientId, recordId, redirectUrl = '/payment/success' } = body;

        console.log('Payment checkout request:', { amount, description, doctorId, doctorName, patientId, recordId, redirectUrl });

        // Create request fingerprint for deduplication
        const requestFingerprint = crypto.createHash('md5')
            .update(`${amount}-${description}-${doctorId}-${patientId}-${Date.now().toString().slice(0, -3)}`) // Remove last 3 digits for 1-second window
            .digest('hex');

        // Check if similar request exists in cache
        const now = Date.now();
        const cachedRequest = requestCache.get(requestFingerprint);

        if (cachedRequest && (now - cachedRequest.timestamp) < CACHE_DURATION) {
            console.log('🔄 Duplicate request detected, returning cached response');
            return cachedRequest.promise;
        }

        // Clean old cache entries
        for (const [key, value] of requestCache.entries()) {
            if (now - value.timestamp > CACHE_DURATION) {
                requestCache.delete(key);
            }
        }

        // Create new request promise
        const requestPromise = processPaymentRequest(body, request);
        requestCache.set(requestFingerprint, { timestamp: now, promise: requestPromise });

        return requestPromise;
    } catch (error: any) {
        console.error('Payment checkout error:', error);
        return NextResponse.json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: error.message || 'Lỗi máy chủ khi xử lý thanh toán'
            }
        }, { status: 500 });
    }
}

async function processPaymentRequest(body: any, request?: NextRequest) {
    try {
        const { amount, description, doctorId, doctorName, patientId, recordId, redirectUrl = '/payment/success' } = body;

        // Kiểm tra cấu hình PayOS
        if (!PAYOS_CLIENT_ID || PAYOS_CLIENT_ID === 'demo' || !PAYOS_API_KEY || PAYOS_API_KEY === 'demo_key') {
            console.error('PayOS configuration missing or using demo values:', {
                clientId: PAYOS_CLIENT_ID,
                apiKey: PAYOS_API_KEY ? 'Exists' : 'Missing',
                checksumKey: PAYOS_CHECKSUM_KEY ? 'Exists' : 'Missing'
            });

            // Đối với môi trường demo hoặc dev, cho phép tiếp tục với giá trị demo
            console.log('⚠️ Using demo values for PayOS in development environment');

            // Trả về kết quả giả lập
            return NextResponse.json({
                success: true,
                data: {
                    checkoutUrl: `/payment/demo?amount=${amount}&doctorName=${encodeURIComponent(doctorName || '')}&orderCode=DEMO-${Date.now()}`,
                    orderCode: `DEMO-${Date.now()}`,
                    amount: amount,
                    description: description || 'Thanh toán khám bệnh (Demo)'
                }
            });
        }

        // Validate amount - PREVENT 0 amount payments
        if (!amount || amount <= 0) {
            console.error('❌ Invalid amount:', amount);
            return NextResponse.json({
                success: false,
                error: {
                    code: 'INVALID_AMOUNT',
                    message: 'Số tiền thanh toán phải lớn hơn 0'
                }
            }, { status: 400 });
        }

        console.log('PayOS configuration:', {
            clientId: PAYOS_CLIENT_ID,
            apiUrl: PAYOS_API_URL,
            appDomain: APP_DOMAIN,
            hasApiKey: !!PAYOS_API_KEY,
            hasChecksumKey: !!PAYOS_CHECKSUM_KEY
        });

        // Create a unique order code (PayOS yêu cầu orderCode là số nguyên)
        // Sử dụng timestamp + random để tránh trùng lặp
        let orderCode = parseInt(`${Date.now()}${Math.floor(Math.random() * 100)}`);

        // Kiểm tra xem orderCode đã tồn tại chưa (cả trong DB và trên PayOS)
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();

        let attempts = 0;
        while (attempts < 5) {
            // Kiểm tra trong database
            const { data: existingPayment } = await supabase
                .from('payments')
                .select('id')
                .eq('order_code', orderCode.toString())
                .single();

            if (!existingPayment) {
                // Kiểm tra trên PayOS
                try {
                    const checkResponse = await axios.get(
                        `${PAYOS_API_URL}/v2/payment-requests/${orderCode}`,
                        {
                            headers: {
                                'x-client-id': PAYOS_CLIENT_ID,
                                'x-api-key': PAYOS_API_KEY,
                            },
                            timeout: 5000
                        }
                    );

                    // Nếu tìm thấy trên PayOS, tạo orderCode mới
                    if (checkResponse.data && checkResponse.data.data) {
                        orderCode = parseInt(`${Date.now()}${Math.floor(Math.random() * 100)}`);
                        attempts++;
                        continue;
                    }
                } catch (error: any) {
                    // Nếu không tìm thấy (404), orderCode này có thể sử dụng
                    if (error.response?.status === 404) {
                        break;
                    }
                }
                break;
            } else {
                // Tạo orderCode mới nếu đã tồn tại trong DB
                orderCode = parseInt(`${Date.now()}${Math.floor(Math.random() * 100)}`);
                attempts++;
            }
        }

        console.log(`🔢 Generated unique orderCode: ${orderCode} (attempts: ${attempts})`);

        // Get current user's patient_id or use provided patientId
        let finalPatientId = patientId;

        if (!finalPatientId) {
            // Get user from session/auth if request is available
            if (request) {
                const authHeader = request.headers.get('authorization');
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    const token = authHeader.substring(7);
                    const { data: { user } } = await supabase.auth.getUser(token);

                    if (user) {
                        // Get user's patient_id
                        const { data: patient } = await supabase
                            .from('patients')
                            .select('patient_id')
                            .eq('profile_id', user.id)
                            .single();

                        if (patient) {
                            finalPatientId = patient.patient_id;
                        } else {
                            // Create patient record if not exists
                            const { data: profile } = await supabase
                                .from('profiles')
                                .select('full_name')
                                .eq('id', user.id)
                                .single();

                            const newPatientId = `PAT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Date.now()).slice(-3)}`;

                            const { data: newPatient } = await supabase
                                .from('patients')
                                .insert({
                                    patient_id: newPatientId,
                                    profile_id: user.id,
                                    full_name: profile?.full_name || user.email?.split('@')[0],
                                    status: 'active'
                                })
                                .select('patient_id')
                                .single();

                            if (newPatient) {
                                finalPatientId = newPatient.patient_id;
                                console.log('✅ [Payment Checkout API] Created patient record:', finalPatientId);
                            }
                        }
                    }
                }
            }
        }

        // Fallback to test patient ID if still no patient_id
        if (!finalPatientId) {
            finalPatientId = 'PAT-202506-001';
        }

        console.log('🧪 [Payment Checkout API] Using patient_id:', finalPatientId, '(from request:', !!patientId, ')');

        // Tạo URLs với thông tin đầy đủ cho email
        const cancelUrl = `${APP_DOMAIN}/payment/cancel`;
        const returnUrl = `${APP_DOMAIN}${redirectUrl}?orderCode=${orderCode}&amount=${amount}&doctorId=${doctorId || ''}&doctorName=${encodeURIComponent(doctorName || '')}&patientId=${finalPatientId || ''}&recordId=${recordId || ''}`;

        // Tạo mô tả mới đảm bảo có patient_id
        let enhancedDescription = description || 'Thanh toán khám bệnh';

        // Mô tả đầy đủ cho lưu vào database (có thể dài)
        let fullDescription = enhancedDescription;

        // Kiểm tra xem mô tả hiện tại có chứa patient_id hay không
        if (!fullDescription.includes('patient_id:')) {
            // Thêm patient_id vào mô tả đầy đủ
            fullDescription = `${fullDescription}, patient_id: ${finalPatientId}`;

            // Thêm record_id vào mô tả đầy đủ nếu có
            if (recordId) {
                fullDescription = `${fullDescription}, record_id: ${recordId}`;
            }
        }

        console.log('🔍 [Payment Checkout API] Enhanced description with patient_id:', fullDescription);

        // Tạo mô tả ngắn gọn cho PayOS (giới hạn 25 ký tự)
        let payosDescription = "Thanh toán khám bệnh";
        if (payosDescription.length > 25) {
            payosDescription = payosDescription.substring(0, 25);
        }

        // Tạo signature theo format PayOS yêu cầu
        // Format: amount=$amount&cancelUrl=$cancelUrl&description=$description&orderCode=$orderCode&returnUrl=$returnUrl
        const signatureData = `amount=${amount}&cancelUrl=${cancelUrl}&description=${payosDescription}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
        const signature = crypto.createHmac('sha256', PAYOS_CHECKSUM_KEY!).update(signatureData).digest('hex');

        // Create payment data for PayOS API
        const paymentData = {
            orderCode,
            amount,
            description: payosDescription,
            cancelUrl,
            returnUrl,
            items: [
                {
                    name: doctorName ? `Khám bệnh với BS ${doctorName}` : 'Khám bệnh',
                    quantity: 1,
                    price: amount
                }
            ],
            signature
        };

        console.log('Sending payment request to PayOS:', paymentData);

        try {
            // Call the PayOS API to create payment
            const response = await axios.post(
                `${PAYOS_API_URL}/v2/payment-requests`,
                paymentData,
                {
                    headers: {
                        'x-client-id': PAYOS_CLIENT_ID,
                        'x-api-key': PAYOS_API_KEY,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000 // Timeout sau 10 giây
                }
            );

            console.log('PayOS API response:', response.data);
            console.log('Checking response code:', response.data?.code, 'Type:', typeof response.data?.code);

            // Check if PayOS returned an error code in the response
            if (response.data && response.data.code === '214') {
                return NextResponse.json({
                    success: false,
                    error: {
                        code: 'PAYOS_GATEWAY_ERROR',
                        message: 'Cổng thanh toán PayOS tạm thời không khả dụng. Vui lòng thử lại sau.'
                    }
                }, { status: 502 });
            }

            // Lưu thông tin payment vào Supabase với kiểm tra trùng lặp
            try {
                // Kiểm tra xem payment đã tồn tại chưa để tránh trùng lặp
                const { data: existingPayment } = await supabase
                    .from('payments')
                    .select('id')
                    .eq('order_code', orderCode.toString())
                    .single();

                if (!existingPayment) {
                    // Use upsert to handle race conditions
                    const { error: insertError } = await supabase
                        .from('payments')
                        .upsert({
                            order_code: orderCode.toString(),
                            amount: amount,
                            description: fullDescription,
                            status: 'pending',
                            payment_method: 'payos',
                            record_id: recordId,
                            doctor_id: doctorId,
                            doctor_name: doctorName,
                            patient_id: finalPatientId,
                            payment_link_id: response.data.data?.paymentLinkId
                        }, {
                            onConflict: 'order_code',
                            ignoreDuplicates: true
                        });

                    if (insertError) {
                        console.error('Error saving payment to database:', insertError);
                        // Không return error vì payment link đã tạo thành công
                    } else {
                        console.log('Payment saved to database successfully');
                    }
                } else {
                    console.log('Payment already exists, skipping insert');
                }
            } catch (dbError) {
                console.error('Database error:', dbError);
                // Không return error vì payment link đã tạo thành công
            }

            // Return the payment data to the client
            return NextResponse.json({
                success: true,
                data: response.data.data,
                code: response.data.code
            });
        } catch (apiError: any) {
            console.error('Error calling PayOS API:', apiError.response?.data || apiError.message);

            // Check if it's a rate limit error
            const errorMessage = apiError.message || '';
            const responseMessage = apiError.response?.data?.message || '';

            if (errorMessage.includes('Too many requests') || responseMessage.includes('Too many requests') ||
                errorMessage.includes('too many requests') || responseMessage.includes('too many requests')) {
                return NextResponse.json({
                    success: false,
                    error: {
                        code: 'RATE_LIMIT_ERROR',
                        message: 'Cổng thanh toán PayOS tạm thời quá tải. Vui lòng thử lại sau 5 phút.'
                    }
                }, { status: 429 });
            }

            // Check if it's a PayOS API error with specific error codes
            const payosResponse = apiError.response?.data;
            console.log('PayOS error response:', payosResponse);
            console.log('Error code check:', payosResponse?.code, payosResponse?.code === '214');

            if (payosResponse && payosResponse.code === '214') {
                return NextResponse.json({
                    success: false,
                    error: {
                        code: 'PAYOS_GATEWAY_ERROR',
                        message: 'Cổng thanh toán PayOS tạm thời không khả dụng. Vui lòng thử lại sau.'
                    }
                }, { status: 502 });
            }

            // Other API errors
            return NextResponse.json({
                success: false,
                error: {
                    code: 'PAYOS_API_ERROR',
                    message: 'Không thể kết nối đến cổng thanh toán PayOS. Vui lòng thử lại sau hoặc chọn phương thức thanh toán khác.',
                    details: apiError.response?.data || apiError.message
                }
            }, { status: 502 });
        }
    } catch (error: any) {
        console.error('Payment checkout error:', error);

        return NextResponse.json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: error.message || 'Lỗi máy chủ khi xử lý thanh toán'
            }
        }, { status: 500 });
    }
} 