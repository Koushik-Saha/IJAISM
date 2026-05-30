# Infra (Terraform)

Provisions the Oracle Cloud Always-Free ARM VM, Cloudflare DNS, and R2 buckets
that host IJAISM.

## One-time prerequisites

1. **Oracle Cloud account** with Always-Free tier eligible region.
2. **OCI API key**: User Settings → API Keys → Add API Key. Save the private
   key file and record the fingerprint.
3. **Cloudflare account** with the production domain (`ijaism.com`) added as a
   zone. Note the zone ID and account ID from the dashboard sidebar.
4. **Cloudflare API token**:
   - Permissions: `Zone:DNS:Edit`, `Account:Workers R2 Storage:Edit`
   - Zone Resources: include the IJAISM zone
   - Account Resources: include your account
5. **Create the Terraform state bucket** once by hand:
   ```
   wrangler r2 bucket create ijaism-tfstate
   ```

## Apply

```
cd infra
cp terraform.tfvars.example terraform.tfvars
$EDITOR terraform.tfvars

export AWS_ACCESS_KEY_ID="<r2-token-access-key>"
export AWS_SECRET_ACCESS_KEY="<r2-token-secret>"
export AWS_ENDPOINT_URL_S3="https://<account-id>.r2.cloudflarestorage.com"

terraform init
terraform plan
terraform apply
```

## After apply

`terraform output` will print the instance IP, SSH command, and bucket names.
Then:

1. `ssh ubuntu@<ip>` and confirm cloud-init finished (`cloud-init status --wait`).
2. `rsync` the repo to `/opt/ijaism/` (or `git clone` once you've added a deploy key).
3. Write `/opt/ijaism/.env` (use `.env.example` from the repo root).
4. `systemctl start ijaism` to bring up the stack.
5. Add GitHub Actions secrets: `OCI_HOST`, `OCI_USER=ubuntu`, `OCI_SSH_KEY`,
   `PRODUCTION_DOMAIN`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
   `R2_BACKUP_BUCKET`, `DATABASE_URL` (for backup workflow), Sentry secrets.

## R2 lifecycle (manual one-time)

The Cloudflare TF provider doesn't expose lifecycle rules yet. After apply,
run:

```
aws --endpoint-url "$AWS_ENDPOINT_URL_S3" s3api put-bucket-lifecycle-configuration \
  --bucket ijaism-db-backups \
  --lifecycle-configuration file://r2-lifecycle.json
```

with `r2-lifecycle.json`:

```json
{
  "Rules": [
    {
      "ID": "expire-30d",
      "Status": "Enabled",
      "Filter": { "Prefix": "" },
      "Expiration": { "Days": 30 }
    }
  ]
}
```
