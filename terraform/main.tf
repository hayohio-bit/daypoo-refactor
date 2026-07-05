terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# CloudFront SSL 인증서를 위한 버지니아 북부 리전 설정
provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
}
