# us-east-1 리전의 ACM 인증서 (CloudFront용)
data "aws_acm_certificate" "main" {
  provider = aws.us-east-1
  domain   = "daypoo.8o2.site"
  statuses = ["ISSUED"]
}

resource "aws_cloudfront_distribution" "main" {
  aliases = ["daypoo.8o2.site"]
  enabled             = true
  is_ipv6_enabled    = true
  default_root_object = "index.html"

  # S3 Origin (프론트엔드)
  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "S3-Frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  # EC2 Origin (백엔드 API)
  origin {
    domain_name = aws_instance.app.public_dns
    origin_id   = "EC2-Backend"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # /api/* 경로는 백엔드(EC2)로 전달
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    target_origin_id = "EC2-Backend"
    allowed_methods  = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods   = ["GET", "HEAD"]
    forwarded_values {
      query_string = true
      cookies { forward = "all" }
      headers = ["Origin", "Authorization", "Content-Type", "Accept", "Host"] # 필수 헤더 추가
    }
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  # OAuth2 및 소셜 로그인 관련 라우팅 추가
  ordered_cache_behavior {
    path_pattern     = "/oauth2/*"
    target_origin_id = "EC2-Backend"
    allowed_methods  = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods   = ["GET", "HEAD"]
    forwarded_values {
      query_string = true
      cookies { forward = "all" }
      headers = ["Origin", "Authorization", "Content-Type", "Accept", "Host"]
    }
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  ordered_cache_behavior {
    path_pattern     = "/login/*"
    target_origin_id = "EC2-Backend"
    allowed_methods  = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods   = ["GET", "HEAD"]
    forwarded_values {
      query_string = true
      cookies { forward = "all" }
      headers = ["Origin", "Authorization", "Content-Type", "Accept", "Host"]
    }
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  # 나머지 모든 요청은 프론트엔드(S3) 정적 파일 제공
  default_cache_behavior {
    target_origin_id = "S3-Frontend"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
    viewer_protocol_policy = "redirect-to-https"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn            = data.aws_acm_certificate.main.arn
    ssl_support_method              = "sni-only"
    minimum_protocol_version        = "TLSv1.2_2021"
  }

  # SPA 라우팅을 위한 에러 응답 설정
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  tags = {
    Name = "${var.project_name}-cf"
  }
}
