# =============================================================================
# Network: VCN + public subnet + internet gateway + security list (22/80/443)
# =============================================================================
resource "oci_core_vcn" "ijaism" {
  compartment_id = var.compartment_id
  display_name   = "ijaism-vcn"
  cidr_blocks    = ["10.10.0.0/16"]
  dns_label      = "ijaism"
}

resource "oci_core_internet_gateway" "ijaism" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.ijaism.id
  display_name   = "ijaism-igw"
}

resource "oci_core_route_table" "public" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.ijaism.id
  display_name   = "ijaism-public-rt"
  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.ijaism.id
  }
}

resource "oci_core_security_list" "public" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.ijaism.id
  display_name   = "ijaism-public-sl"

  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
  }

  # SSH
  ingress_security_rules {
    protocol = "6" # TCP
    source   = "0.0.0.0/0"
    tcp_options {
      min = 22
      max = 22
    }
  }
  # HTTP (Caddy redirects to HTTPS)
  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 80
      max = 80
    }
  }
  # HTTPS
  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 443
      max = 443
    }
  }
  # HTTP/3 (QUIC)
  ingress_security_rules {
    protocol = "17" # UDP
    source   = "0.0.0.0/0"
    udp_options {
      min = 443
      max = 443
    }
  }
}

resource "oci_core_subnet" "public" {
  compartment_id             = var.compartment_id
  vcn_id                     = oci_core_vcn.ijaism.id
  cidr_block                 = "10.10.1.0/24"
  display_name               = "ijaism-public-subnet"
  route_table_id             = oci_core_route_table.public.id
  security_list_ids          = [oci_core_security_list.public.id]
  prohibit_public_ip_on_vnic = false
  dns_label                  = "public"
}

# =============================================================================
# Latest Ubuntu 22.04 ARM image
# =============================================================================
data "oci_core_images" "ubuntu_arm" {
  compartment_id           = var.compartment_id
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "22.04"
  shape                    = var.instance_shape
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

# =============================================================================
# Instance
# =============================================================================
resource "oci_core_instance" "app" {
  compartment_id      = var.compartment_id
  availability_domain = var.availability_domain
  shape               = var.instance_shape
  display_name        = "ijaism-app"

  shape_config {
    ocpus         = var.instance_ocpus
    memory_in_gbs = var.instance_memory
  }

  source_details {
    source_type             = "image"
    source_id               = data.oci_core_images.ubuntu_arm.images[0].id
    boot_volume_size_in_gbs = var.boot_volume_size
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.public.id
    assign_public_ip = true
    hostname_label   = "app"
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data           = base64encode(file("${path.module}/cloud-init.yaml"))
  }

  # Re-applying TF should never randomly rebuild the box.
  lifecycle {
    ignore_changes = [source_details]
  }
}

# =============================================================================
# Cloudflare DNS — A and CNAME, proxied for free CDN/WAF
# =============================================================================
resource "cloudflare_record" "root" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  type    = "A"
  content = oci_core_instance.app.public_ip
  proxied = true
  ttl     = 1 # Cloudflare requires ttl=1 (auto) when proxied=true
}

resource "cloudflare_record" "www" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  type    = "CNAME"
  content = var.domain_name
  proxied = true
  ttl     = 1
}

# =============================================================================
# Cloudflare R2 — uploads + backups buckets with lifecycle on backups
# =============================================================================
resource "cloudflare_r2_bucket" "uploads" {
  account_id = var.cloudflare_account_id
  name       = var.uploads_bucket_name
  location   = "ENAM" # Eastern North America; pick the region closest to you
}

resource "cloudflare_r2_bucket" "backups" {
  account_id = var.cloudflare_account_id
  name       = var.backups_bucket_name
  location   = "ENAM"
}

# Note: the Cloudflare Terraform provider does not yet support R2 lifecycle
# rules as a first-class resource. Configure 30-day expiry on the backups
# bucket from the Cloudflare dashboard, OR via the R2 S3 API:
#
#   aws --endpoint-url $R2_ENDPOINT s3api put-bucket-lifecycle-configuration \
#     --bucket ijaism-db-backups \
#     --lifecycle-configuration file://infra/r2-lifecycle.json
