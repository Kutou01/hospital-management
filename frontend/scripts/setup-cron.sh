#!/bin/bash

# Setup Cron Job for Payment Sync
# Tự động đồng bộ thanh toán mỗi 5 phút

echo "🏥 Hospital Management - Payment Sync Cron Setup"
echo "================================================="

# Kiểm tra quyền root
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  This script should be run as root or with sudo"
    echo "   Usage: sudo ./scripts/setup-cron.sh"
    exit 1
fi

# Lấy thông tin project
PROJECT_DIR=$(pwd)
NODE_PATH=$(which node)
NPM_PATH=$(which npm)

if [ -z "$NODE_PATH" ]; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

if [ -z "$NPM_PATH" ]; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

echo "📍 Project directory: $PROJECT_DIR"
echo "📍 Node.js path: $NODE_PATH"
echo "📍 npm path: $NPM_PATH"

# Tạo script wrapper
WRAPPER_SCRIPT="/usr/local/bin/hospital-payment-sync"
echo "📝 Creating wrapper script: $WRAPPER_SCRIPT"

cat > "$WRAPPER_SCRIPT" << EOF
#!/bin/bash

# Hospital Payment Sync Wrapper Script
# Generated automatically by setup-cron.sh

export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
export NODE_ENV=production

# Change to project directory
cd "$PROJECT_DIR"

# Load environment variables if .env exists
if [ -f .env.local ]; then
    export \$(cat .env.local | grep -v '^#' | xargs)
fi

if [ -f .env ]; then
    export \$(cat .env | grep -v '^#' | xargs)
fi

# Run the sync script
echo "\$(date): Starting payment sync job" >> /var/log/hospital-payment-sync.log
"$NODE_PATH" scripts/sync-payments.js >> /var/log/hospital-payment-sync.log 2>&1
echo "\$(date): Payment sync job completed" >> /var/log/hospital-payment-sync.log
EOF

# Cấp quyền thực thi
chmod +x "$WRAPPER_SCRIPT"
echo "✅ Wrapper script created and made executable"

# Tạo log file
LOG_FILE="/var/log/hospital-payment-sync.log"
touch "$LOG_FILE"
chmod 644 "$LOG_FILE"
echo "✅ Log file created: $LOG_FILE"

# Thêm cron job
CRON_JOB="*/5 * * * * $WRAPPER_SCRIPT"
echo "📅 Adding cron job: $CRON_JOB"

# Kiểm tra xem cron job đã tồn tại chưa
if crontab -l 2>/dev/null | grep -q "hospital-payment-sync"; then
    echo "⚠️  Cron job already exists. Removing old one..."
    crontab -l 2>/dev/null | grep -v "hospital-payment-sync" | crontab -
fi

# Thêm cron job mới
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
echo "✅ Cron job added successfully"

# Khởi động cron service
if systemctl is-active --quiet cron; then
    echo "✅ Cron service is already running"
elif systemctl is-active --quiet crond; then
    echo "✅ Crond service is already running"
else
    echo "🚀 Starting cron service..."
    if command -v systemctl >/dev/null 2>&1; then
        systemctl start cron || systemctl start crond
        systemctl enable cron || systemctl enable crond
    else
        service cron start || service crond start
    fi
fi

echo ""
echo "🎉 Payment sync cron job setup completed!"
echo ""
echo "📋 Summary:"
echo "   - Cron job: Every 5 minutes"
echo "   - Script: $WRAPPER_SCRIPT"
echo "   - Log file: $LOG_FILE"
echo ""
echo "🔧 Management commands:"
echo "   - View cron jobs: crontab -l"
echo "   - View logs: tail -f $LOG_FILE"
echo "   - Remove cron job: crontab -e (then delete the line)"
echo ""
echo "⚠️  Note: Make sure your .env file contains the correct PayOS credentials"
