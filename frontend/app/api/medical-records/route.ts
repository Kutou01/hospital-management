import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        console.log('Medical records API route called');

        // Parse request body
        const body = await request.json();
        console.log('Request body:', body);

        // Generate a unique record ID
        const recordId = `MR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Return mock success response for development
        return NextResponse.json({
            success: true,
            data: {
                id: recordId,
                patientName: body.patientName,
                symptoms: body.symptoms,
                doctorId: body.doctorId,
                doctorName: body.doctorName,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        });
    } catch (error: any) {
        console.error('Medical record creation error:', error);

        // Return error response
        return NextResponse.json({
            success: false,
            error: {
                message: error.message || 'Lỗi tạo hồ sơ y tế',
                code: 'SERVER_ERROR'
            }
        }, { status: 500 });
    }
}
