// Script để test các API thanh toán và khôi phục
async function main() {
    try {
        console.log('🚀 Starting test script...');

        // 1. Tạo thanh toán test không có patient_id
        console.log('📝 Creating test payments...');
        const createResponse = await fetch('http://localhost:3000/api/test-payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const createData = await createResponse.json();
        console.log('✅ Test payments created:', createData.data?.length || 0);

        // 2. Kiểm tra số lượng thanh toán cần khôi phục
        console.log('🔍 Checking payments to recover...');
        const checkResponse = await fetch('http://localhost:3000/api/payment/recover-missing');
        const checkData = await checkResponse.json();
        console.log('📊 Payments needing recovery:', checkData.missing_count || 0);

        // 3. Chạy quá trình khôi phục
        console.log('🔄 Running recovery process...');
        const recoveryResponse = await fetch('http://localhost:3000/api/payment/recover-missing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const recoveryData = await recoveryResponse.json();
        console.log('✅ Recovery completed:');
        console.log(`   - Total processed: ${recoveryData.data?.total || 0}`);
        console.log(`   - Successfully recovered: ${recoveryData.data?.recovered || 0}`);

        // 4. Kiểm tra lại số lượng thanh toán cần khôi phục
        console.log('🔍 Checking payments after recovery...');
        const finalCheckResponse = await fetch('http://localhost:3000/api/payment/recover-missing');
        const finalCheckData = await finalCheckResponse.json();
        console.log('📊 Remaining payments needing recovery:', finalCheckData.missing_count || 0);

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Chạy script
main(); 