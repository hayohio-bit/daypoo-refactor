output "cloudfront_domain_name" {
  description = "이 주소가 당신의 최종 배포 주소입니다!"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "ec2_public_ip" {
  description = "EC2_HOST 시크릿에 등록할 값입니다."
  value       = aws_instance.app.public_ip
}

output "rds_endpoint" {
  description = "DB_HOST 시크릿에 등록할 값입니다."
  value       = aws_db_instance.postgres.address
}

output "opensearch_endpoint" {
  description = "OPENSEARCH_URL 시크릿에 등록할 값입니다. (https:// 포함하여 등록)"
  value       = "https://${aws_opensearch_domain.main.endpoint}"
}
