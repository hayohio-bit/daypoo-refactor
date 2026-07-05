# ── OpenSearch 보안 그룹 (EC2에서만 443 허용) ──
resource "aws_security_group" "opensearch" {
  name        = "${var.project_name}-opensearch-sg"
  description = "OpenSearch Security Group - EC2 only"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-opensearch-sg"
  }
}

# ── OpenSearch 서비스 연결 역할 (VPC 배포 시 필수) ──
resource "aws_iam_service_linked_role" "opensearch" {
  aws_service_name = "opensearchservice.amazonaws.com"

  # 계정에 이미 존재하는 경우 에러를 무시
  lifecycle {
    ignore_changes = all
  }
}

# ── OpenSearch 도메인 ──
resource "aws_opensearch_domain" "main" {
  domain_name    = "${var.project_name}-search"
  engine_version = "OpenSearch_2.15"

  cluster_config {
    instance_type  = "t3.small.search"
    instance_count = 1
  }

  ebs_options {
    ebs_enabled = true
    volume_size = 20
    volume_type = "gp3"
  }

  # EC2와 동일한 VPC/서브넷에 배치 → 내부 통신만 허용
  vpc_options {
    subnet_ids         = [aws_subnet.public_1.id]
    security_group_ids = [aws_security_group.opensearch.id]
  }

  node_to_node_encryption {
    enabled = true
  }

  encrypt_at_rest {
    enabled = true
  }

  domain_endpoint_options {
    enforce_https = true
  }

  # VPC 내부에서는 SG가 접근 제어 → 정책은 VPC 내 전체 허용
  access_policies = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { "AWS" = "*" }
        Action    = "es:*"
        Resource  = "arn:aws:es:${var.aws_region}:*:domain/${var.project_name}-search/*"
      }
    ]
  })

  depends_on = [aws_iam_service_linked_role.opensearch]

  tags = {
    Name = "${var.project_name}-opensearch"
  }
}
