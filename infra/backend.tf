# Terraform state stored in Cloudflare R2 via the S3-compatible backend.
# Create the state bucket once by hand (or with `wrangler r2 bucket create
# ijaism-tfstate`) before `terraform init`.
#
# Required env vars when running terraform:
#   AWS_ACCESS_KEY_ID     -> R2 API token access key
#   AWS_SECRET_ACCESS_KEY -> R2 API token secret
#   AWS_ENDPOINT_URL_S3   -> https://<account-id>.r2.cloudflarestorage.com
#                           (or pass `-backend-config="endpoint=..."`)
#
# Locking is via DynamoDB normally; R2 doesn't speak DynamoDB so we run
# without locking. Acceptable for a one-developer project; switch to
# Terraform Cloud free if multiple operators are involved.

terraform {
  backend "s3" {
    bucket                      = "ijaism-tfstate"
    key                         = "ijaism/terraform.tfstate"
    region                      = "auto"
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    use_path_style              = true
    # endpoint passed via env: AWS_ENDPOINT_URL_S3
  }
}
