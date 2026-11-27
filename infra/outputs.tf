output "instance_public_ip" {
  value       = oci_core_instance.app.public_ip
  description = "Add this to the OCI_HOST GitHub Actions secret."
}

output "instance_ssh" {
  value       = "ssh ubuntu@${oci_core_instance.app.public_ip}"
  description = "First-boot login. Add your key to OCI_SSH_KEY GH secret."
}

output "r2_uploads_bucket" {
  value = cloudflare_r2_bucket.uploads.name
}

output "r2_backups_bucket" {
  value = cloudflare_r2_bucket.backups.name
}

output "r2_endpoint_hint" {
  value       = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
  description = "Put this in AWS_S3_ENDPOINT on the VM and R2_ENDPOINT GH secret."
}
