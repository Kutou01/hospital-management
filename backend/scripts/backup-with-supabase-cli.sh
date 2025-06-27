#!/bin/bash

# Hospital Management System - Supabase CLI Backup
# Prerequisites: Install Supabase CLI first
# npm install -g supabase

echo "🏥 Hospital Management System - Supabase CLI Backup"
echo "=================================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Create backup directory
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🔐 Login to Supabase (if not already logged in)..."
supabase login

echo "📊 Getting project info..."
PROJECT_ID="ciasxktujslgsdgylimv"

echo "💾 Creating database dump..."
supabase db dump --project-id $PROJECT_ID --file "$BACKUP_DIR/supabase_dump_$TIMESTAMP.sql"

echo "📋 Exporting schema..."
supabase db dump --project-id $PROJECT_ID --schema-only --file "$BACKUP_DIR/supabase_schema_$TIMESTAMP.sql"

echo "📦 Exporting data..."
supabase db dump --project-id $PROJECT_ID --data-only --file "$BACKUP_DIR/supabase_data_$TIMESTAMP.sql"

echo "✅ Supabase CLI backup completed!"
echo "📁 Files saved in: $BACKUP_DIR/"
ls -la $BACKUP_DIR/
