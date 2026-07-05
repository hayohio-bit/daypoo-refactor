resource "aws_db_instance" "postgres" {
  identifier        = "${var.project_name}-db"
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  db_name           = "daypoo_db"
  username          = var.db_username
  password          = var.db_password
  
  # 프리티어 비용을 위해 퍼블릭 액세스 대신 EC2 보안그룹에서만 허용 (network.tf 설정 연동)
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  skip_final_snapshot = true
  publicly_accessible = false
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = [aws_subnet.public_1.id, aws_subnet.public_2.id]
}
