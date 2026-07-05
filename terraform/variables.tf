variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-2"
}

variable "openai_api_key" {
  description = "OpenAI API Key for Lambda Bot"
  type        = string
  sensitive   = true
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "daypoo"
}

variable "db_username" {
  description = "RDS User"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "RDS Password"
  type        = string
  sensitive   = true
}
