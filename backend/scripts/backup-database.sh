#!/bin/bash

# Hospital Management System - Database Backup Script
# Usage: ./backup-database.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🏥 Hospital Management System - Database Backup${NC}"
echo "=================================================="

# Database connection details
DB_HOST="db.ciasxktujslgsdgylimv.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

# Prompt for password
echo -e "${YELLOW}Enter your Supabase database password:${NC}"
read -s DB_PASSWORD

# Create backup directory
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/hospital_db_backup_$TIMESTAMP.sql"

echo -e "${YELLOW}Creating database backup...${NC}"

# Create full database backup
PGPASSWORD=$DB_PASSWORD pg_dump \
  --host=$DB_HOST \
  --port=$DB_PORT \
  --username=$DB_USER \
  --dbname=$DB_NAME \
  --verbose \
  --clean \
  --no-owner \
  --no-privileges \
  --format=plain \
  --file=$BACKUP_FILE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup completed successfully!${NC}"
    echo -e "${GREEN}📁 Backup saved to: $BACKUP_FILE${NC}"
    
    # Show file size
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}📊 Backup size: $FILE_SIZE${NC}"
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi

# Create schema-only backup
SCHEMA_FILE="$BACKUP_DIR/hospital_schema_$TIMESTAMP.sql"
echo -e "${YELLOW}Creating schema-only backup...${NC}"

PGPASSWORD=$DB_PASSWORD pg_dump \
  --host=$DB_HOST \
  --port=$DB_PORT \
  --username=$DB_USER \
  --dbname=$DB_NAME \
  --schema-only \
  --verbose \
  --clean \
  --no-owner \
  --no-privileges \
  --format=plain \
  --file=$SCHEMA_FILE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema backup completed!${NC}"
    echo -e "${GREEN}📁 Schema saved to: $SCHEMA_FILE${NC}"
fi

# Create data-only backup
DATA_FILE="$BACKUP_DIR/hospital_data_$TIMESTAMP.sql"
echo -e "${YELLOW}Creating data-only backup...${NC}"

PGPASSWORD=$DB_PASSWORD pg_dump \
  --host=$DB_HOST \
  --port=$DB_PORT \
  --username=$DB_USER \
  --dbname=$DB_NAME \
  --data-only \
  --verbose \
  --no-owner \
  --no-privileges \
  --format=plain \
  --file=$DATA_FILE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Data backup completed!${NC}"
    echo -e "${GREEN}📁 Data saved to: $DATA_FILE${NC}"
fi

echo ""
echo -e "${GREEN}🎉 All backups completed successfully!${NC}"
echo -e "${YELLOW}📋 Backup files created:${NC}"
echo "   - Full backup: $BACKUP_FILE"
echo "   - Schema only: $SCHEMA_FILE" 
echo "   - Data only: $DATA_FILE"
echo ""
echo -e "${YELLOW}💡 To restore from backup, use:${NC}"
echo "   psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $BACKUP_FILE"
