# Database Restore Procedure

## Prerequisites
- `psql` command line tool installed.
- Access to the target database URL (e.g., Neon connection string).
- The backup SQL file downloaded from S3/Blob storage.

## Restore Steps

1. **Download Backup**:
   Get the `.sql` file you want to restore.

2. **Clear Existing Data (Optional/Risky)**:
   If doing a fresh restore, ensure the target DB is clean.
   ```bash
   # WARNING: This destroys data
   psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
   ```

3. **Restore**:
   Use `psql` to run the backup file against the database.
   ```bash
   psql "$DATABASE_URL" < backup_2023-10-27.sql
   ```

4. **Verify**:
   Check if tables and data exist.
   ```bash
   psql "$DATABASE_URL" -c "\dt"
   psql "$DATABASE_URL" -c "SELECT count(*) FROM \"User\";"
   ```

## Troubleshooting
- **Connection Errors**: Check if your IP is allowed in Neon/AWS settings.
- **Permission Errors**: Ensure the DB user has `CREATE` and `ALTER` permissions.
