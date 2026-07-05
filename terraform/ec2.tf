data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023*-x86_64"]
  }
}

resource "aws_key_pair" "main" {
  key_name   = "${var.project_name}-key"
  public_key = file(pathexpand("~/.ssh/id_rsa.pub")) # SSH 퍼블릭 키 자동 인식
}

resource "aws_instance" "app" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = "t3.micro"
  key_name               = aws_key_pair.main.key_name
  vpc_security_group_ids = [aws_security_group.ec2.id]
  subnet_id              = aws_subnet.public_1.id

  user_data = <<-EOF
    #!/bin/bash
    # 패키지 업데이트
    dnf update -y
    
    # Docker 설치 및 서비스 실행
    dnf install -y docker
    systemctl start docker
    systemctl enable docker
    
    # ec2-user에게 Docker 권한 부여
    usermod -aG docker ec2-user
    
    # Docker Compose 설치 (최신 버전 v2.x)
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
    
    # ── Swap 2GB (프리티어 메모리 보강용 필수!) ──
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile swap swap defaults 0 0' >> /etc/fstab
    
    # 배포용 디렉토리 생성
    mkdir -p /opt/daypoo
    chown -R ec2-user:ec2-user /opt/daypoo
  EOF

  tags = {
    Name = "${var.project_name}-ec2"
  }
}
