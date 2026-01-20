#!/bin/bash

# C5K Platform Database Backup Script
# Usage: ./scripts/backup-db.sh

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set. Please check your .env file."
  exit 1
fi

# Create backups directory if it doesn't exist
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

echo "Starting backup to $FILENAME..."

# Run pg_dump
# Note: Requires postgresql-client installed on the system
if ! command -v pg_dump &> /dev/null; then
    echo "Error: pg_dump could not be found. Please install postgresql-client."
    exit 1
fi

pg_dump "$DATABASE_URL" -f "$FILENAME"

if [ $? -eq 0 ]; then
  echo "✅ Backup completed successfully: $FILENAME"
  
  # Remove backups older than 7 days
  find "$BACKUP_DIR" -type f -name "*.sql" -mtime +7 -exec rm {} \;
  echo "Cleaned up backups older than 7 days."
else
  echo "❌ Backup failed."
  exit 1
fi
