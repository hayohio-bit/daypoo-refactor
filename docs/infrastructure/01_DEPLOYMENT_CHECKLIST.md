# 🚀 DayPoo AWS 배포 체크리스트

이 문서는 DayPoo 프로젝트를 AWS에 배포하기 위한 단계별 가이드입니다.

---

## ✅ Phase 1: 선행 작업 (배포 전 준비)

### 1.1 Docker Hub 설정
- [ ] [Docker Hub](https://hub.docker.com) 가입
- [ ] Docker Hub에서 Access Token 생성
  - Account Settings → Security → New Access Token
  - 권한: Read, Write, Delete 선택
  - 생성된 토큰 복사 (다시 볼 수 없으므로 주의!)

### 1.2 AWS 계정 설정
- [ ] AWS 계정 생성 (프리티어 활용)
- [ ] IAM 사용자 생성
  - IAM → Users → Create user
  - 이름: `daypoo-github-actions`
  - 권한: `AmazonS3FullAccess`, `AmazonEC2FullAccess` 추가
- [ ] Access Key 생성
  - IAM User → Security credentials → Create access key
  - Use case: CLI 선택
  - Access Key ID와 Secret Access Key 저장 (안전한 곳에 보관!)

### 1.3 EC2 인스턴스 생성
- [ ] EC2 콘솔 → Launch Instance
  - **이름**: `daypoo-server`
  - **AMI**: Amazon Linux 2023 (프리티어)
  - **인스턴스 타입**: `t2.micro` (프리티어)
  - **키페어**: 새로 생성 → `daypoo-key.pem` 다운로드
  - **보안 그룹**:
    - SSH (22): 내 IP 또는 전체 허용 (GitHub Actions용)
    - HTTP (80): 0.0.0.0/0
    - HTTPS (443): 0.0.0.0/0
    - Custom TCP (8080): 0.0.0.0/0 (백엔드)
    - Custom TCP (8000): 0.0.0.0/0 (AI 서비스)
  - **스토리지**: 30GB gp3 (프리티어)
- [ ] 인스턴스 시작 후 Public IP 확인 및 기록

### 1.4 EC2 초기 설정 (SSH 접속 필요)
```bash
# 로컬에서 SSH 접속
chmod 400 daypoo-key.pem
ssh -i daypoo-key.pem ec2-user@<EC2_PUBLIC_IP>

# Docker 설치
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 재접속 (그룹 권한 적용)
exit
ssh -i daypoo-key.pem ec2-user@<EC2_PUBLIC_IP>

# 작업 디렉토리 생성
sudo mkdir -p /opt/daypoo
sudo chown ec2-user:ec2-user /opt/daypoo
cd /opt/daypoo

# docker-compose.prod.yml 업로드 (로컬에서 실행)
# scp -i daypoo-key.pem d:\poop-map\docker-compose.prod.yml ec2-user@<EC2_PUBLIC_IP>:/opt/daypoo/
```

### 1.5 S3 버킷 생성 (프론트엔드 호스팅용)
- [ ] S3 콘솔 → Create bucket
  - **이름**: `daypoo-frontend` (전역 고유 이름 필요)
  - **리전**: `ap-northeast-2` (서울)
  - **퍼블릭 액세스 차단**: 해제 (정적 웹사이트 호스팅용)
- [ ] 버킷 정책 설정
  - Permissions → Bucket Policy:
    ```json
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "PublicReadGetObject",
          "Effect": "Allow",
          "Principal": "*",
          "Action": "s3:GetObject",
          "Resource": "arn:aws:s3:::daypoo-frontend/*"
        }
      ]
    }
    ```
- [ ] 정적 웹사이트 호스팅 활성화
  - Properties → Static website hosting → Enable
  - Index document: `index.html`

---

## ✅ Phase 2: GitHub Repository 설정

### 2.1 Repository 생성
- [ ] GitHub에서 `daypoo` 레포지토리 생성 (Private)
- [ ] 로컬에서 리모트 추가 및 푸시
  ```bash
  cd d:\poop-map
  git remote add origin https://github.com/<YOUR_USERNAME>/daypoo.git
  git branch -M main
  git push -u origin main
  ```

### 2.2 GitHub Secrets 등록
> 📘 상세 가이드: [02_GITHUB_SECRETS_SETUP.md](./02_GITHUB_SECRETS_SETUP.md) 참고

**Settings → Secrets and variables → Actions → New repository secret**

#### Docker Hub (2개)
- [ ] `DOCKERHUB_USERNAME`
- [ ] `DOCKERHUB_TOKEN`

#### AWS (5개)
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `AWS_REGION` = `ap-northeast-2`
- [ ] `EC2_SSH_PRIVATE_KEY` (daypoo-key.pem 전체 내용)
- [ ] `EC2_HOST` (EC2 Public IP)

#### Database (5개)
- [ ] `POSTGRES_USER` = `daypoo`
- [ ] `POSTGRES_PASSWORD` (강력한 비밀번호로 변경!)
- [ ] `POSTGRES_DB` = `daypoo_db`
- [ ] `DB_HOST` = `localhost` (EC2 내부에서 접근)
- [ ] `DB_PORT` = `5432`

#### Auth (5개)
- [ ] `JWT_SECRET_KEY` (새로 생성 권장)
- [ ] `KAKAO_CLIENT_ID`
- [ ] `KAKAO_CLIENT_SECRET`
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`

#### External APIs (5개)
- [ ] `OPENAI_API_KEY`
- [ ] `PUBLIC_DATA_API_KEY`
- [ ] `TOSS_SECRET_KEY`
- [ ] `VITE_TOSS_CLIENT_KEY`
- [ ] `VITE_KAKAO_MAP_KEY`

#### Email (2개)
- [ ] `MAIL_USERNAME`
- [ ] `MAIL_PASSWORD`

**총 24개 시크릿 등록 완료 여부**: ⬜

---

## ✅ Phase 3: 배포 실행

### 3.1 첫 배포 (수동 실행)
- [ ] GitHub → Actions 탭 이동
- [ ] "Deploy to AWS (DayPoo)" 워크플로우 선택
- [ ] **Run workflow** → **Run workflow** 클릭
- [ ] 배포 진행 상황 모니터링 (약 5-10분 소요)

### 3.2 배포 성공 확인
#### 3.2.1 Docker Hub
- [ ] [Docker Hub](https://hub.docker.com) 접속
- [ ] Repositories에서 확인:
  - `<USERNAME>/daypoo-backend:latest`
  - `<USERNAME>/daypoo-ai:latest`

#### 3.2.2 S3 프론트엔드
- [ ] S3 콘솔 → `daypoo-frontend` 버킷
- [ ] Objects 탭에서 빌드 파일 확인 (index.html, assets/ 등)
- [ ] Properties → Static website hosting URL로 접속 테스트

#### 3.2.3 EC2 백엔드/AI 서비스
```bash
# EC2 SSH 접속
ssh -i daypoo-key.pem ec2-user@<EC2_PUBLIC_IP>

# 컨테이너 확인
docker ps

# 예상 출력:
# - daypoo-backend (8080 포트)
# - daypoo-ai (8000 포트)
# - postgres (5432 포트)
# - redis (6379 포트)

# 백엔드 헬스체크
curl http://localhost:8080/api/health

# AI 서비스 헬스체크
curl http://localhost:8000/health
```

#### 3.2.4 브라우저 테스트
- [ ] 프론트엔드: `http://<EC2_PUBLIC_IP>` 또는 S3 Static Website URL
- [ ] 백엔드 API: `http://<EC2_PUBLIC_IP>:8080/api/health`
- [ ] 로그인 테스트 (카카오/구글 OAuth)

---

## ✅ Phase 4: 배포 후 설정

### 4.1 OAuth Redirect URI 업데이트
#### 카카오 로그인
- [ ] [카카오 개발자 콘솔](https://developers.kakao.com) 접속
- [ ] 내 애플리케이션 → 앱 설정 → 카카오 로그인
- [ ] Redirect URI 추가:
  - `http://<EC2_PUBLIC_IP>/oauth/kakao/callback`
  - (CloudFront 설정 후) `https://<CLOUDFRONT_DOMAIN>/oauth/kakao/callback`

#### 구글 로그인
- [ ] [Google Cloud Console](https://console.cloud.google.com) 접속
- [ ] APIs & Services → Credentials
- [ ] OAuth 2.0 Client IDs 클릭
- [ ] Authorized redirect URIs 추가:
  - `http://<EC2_PUBLIC_IP>/oauth/google/callback`
  - (CloudFront 설정 후) `https://<CLOUDFRONT_DOMAIN>/oauth/google/callback`

### 4.2 토스 결제 설정
- [ ] [토스페이먼츠 개발자센터](https://developers.tosspayments.com) 접속
- [ ] 실제 결제를 받으려면 라이브 키로 변경
  - GitHub Secrets에서 `TOSS_SECRET_KEY`, `VITE_TOSS_CLIENT_KEY` 업데이트

### 4.3 도메인 연결 (선택사항)
- [ ] Route 53 또는 외부 DNS에서 도메인 구매
- [ ] A 레코드 추가: `daypoo.com` → EC2 Public IP
- [ ] SSL 인증서 적용 (Let's Encrypt + Nginx)

---

## ✅ Phase 5: 모니터링 및 유지보수

### 5.1 로그 확인
```bash
# EC2 SSH 접속
ssh -i daypoo-key.pem ec2-user@<EC2_PUBLIC_IP>

# 백엔드 로그
docker logs -f daypoo-backend

# AI 서비스 로그
docker logs -f daypoo-ai

# PostgreSQL 로그
docker logs -f postgres
```

### 5.2 자동 배포 확인
- [ ] `main` 브랜치에 커밋/푸시 시 자동 배포 확인
- [ ] GitHub Actions 탭에서 워크플로우 실행 내역 확인

### 5.3 비용 모니터링
- [ ] AWS Billing 대시보드 정기 확인
- [ ] 프리티어 한도 초과 알림 설정
  - CloudWatch → Billing → Create Alarm

---

## 🆘 문제 해결

### 배포 실패 시
1. **GitHub Actions 로그 확인**
   - Actions 탭 → 실패한 워크플로우 클릭 → 빨간색 X 표시 단계 확인

2. **시크릿 검증**
   - Settings → Secrets and variables → Actions
   - 모든 시크릿이 올바르게 등록되었는지 확인 (대소문자 정확히!)

3. **EC2 SSH 연결 실패**
   - EC2 보안 그룹에서 22번 포트 허용 확인
   - `EC2_SSH_PRIVATE_KEY`에 PEM 파일 전체 내용 복사했는지 확인

4. **Docker 이미지 빌드 실패**
   - Dockerfile 문법 확인
   - Docker Hub 로그인 확인 (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`)

### EC2 컨테이너 실행 실패
```bash
# EC2 접속 후 수동 실행 테스트
cd /opt/daypoo
docker-compose -f docker-compose.prod.yml up -d

# 로그 확인
docker-compose logs -f

# 컨테이너 재시작
docker-compose down
docker-compose up -d
```

### S3 프론트엔드 접속 실패
- [ ] S3 버킷 정책 확인 (퍼블릭 읽기 허용)
- [ ] CloudFront 캐시 무효화: `aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"`

---

## 📚 추가 리소스

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Docker Hub 문서](https://docs.docker.com/docker-hub/)
- [AWS EC2 프리티어](https://aws.amazon.com/free/)
- [AWS S3 정적 웹사이트 호스팅](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)

---

**작성일**: 2026-03-26
**프로젝트**: DayPoo
**배포 환경**: AWS Free Tier (EC2 t2.micro + S3 + RDS db.t3.micro)

**Good Luck! 🚀**
