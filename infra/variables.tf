# -----------------------------------------------------------------------------
# Oracle Cloud authentication (from OCI console → User Settings → API Keys)
# -----------------------------------------------------------------------------
variable "tenancy_ocid" {
  type = string
}

variable "user_ocid" {
  type = string
}

variable "fingerprint" {
  type = string
}

variable "private_key_path" {
  type        = string
  description = "Absolute path to the OCI API private key (.pem)."
}

variable "oci_region" {
  type    = string
  default = "us-ashburn-1"
}

variable "compartment_id" {
  type        = string
  description = "OCID of the compartment to deploy into (usually your root tenancy OCID for personal use)."
}

# -----------------------------------------------------------------------------
# Instance shape — Always-Free Ampere A1.Flex
# -----------------------------------------------------------------------------
variable "instance_shape" {
  type    = string
  default = "VM.Standard.A1.Flex"
}

variable "instance_ocpus" {
  type    = number
  default = 4
}

variable "instance_memory" {
  type        = number
  default     = 24
  description = "Memory in GB."
}

variable "boot_volume_size" {
  type        = number
  default     = 50
  description = "Boot volume size in GB."
}

variable "availability_domain" {
  type        = string
  description = "AD name to launch in, e.g. 'Uocm:US-ASHBURN-AD-1'."
}

variable "ssh_public_key" {
  type        = string
  description = "Contents of the SSH public key to drop into ~ubuntu/.ssh/authorized_keys."
}

# -----------------------------------------------------------------------------
# Cloudflare
# -----------------------------------------------------------------------------
variable "cloudflare_api_token" {
  type        = string
  sensitive   = true
  description = "Token with Zone:DNS:Edit + Account:Workers R2 Storage:Edit."
}

variable "cloudflare_account_id" {
  type = string
}

variable "cloudflare_zone_id" {
  type = string
}

variable "domain_name" {
  type        = string
  description = "e.g. ijaism.com"
}

# -----------------------------------------------------------------------------
# Bucket names — must be globally unique within the Cloudflare account
# -----------------------------------------------------------------------------
variable "uploads_bucket_name" {
  type    = string
  default = "ijaism-uploads"
}

variable "backups_bucket_name" {
  type    = string
  default = "ijaism-db-backups"
}
