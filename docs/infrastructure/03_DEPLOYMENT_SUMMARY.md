# 🎯 DayPoo 배포 준비 완료 요약

이 문서는 Claude Code가 완료한 작업과 다음 단계를 요약합니다.

---

## ✅ 완료된 작업 (2026-03-26)

### 1. Frontend 수정사항 구현
**우리 동네 왕 (Local Ranking) GPS → homeRegion 변경**

#### 변경된 파일:
1. **[frontend/src/types/api.ts](frontend/src/types/api.ts#L38)**
   - `UserResponse` 인터페이스에 `homeRegion?: string | null;` 필드 추가

2. **[frontend/src/pages/RankingPage.tsx](frontend/src/pages/RankingPage.tsx#L574)**
   - GPS geolocation 로직 제거 (navigator.geolocation 제거)
   - `const regionName = user?.homeRegion ?? undefined;` 사용

3. **[frontend/src/hooks/useRankings.ts](frontend/src/hooks/useRankings.ts#L31)**
   - `local` 탭에서 regionName이 없으면 API 호출 스킵
   - '서울' 기본값 제거

**효과**:
- 사용자의 홈 지역(회원가입 시 설정)을 기준으로 지역 랭킹 표시
- GPS 위치 권한 불필요
- 더 빠르고 안정적인 지역 랭킹 로딩

---

### 2. 배포 문서 작성

#### 📘 [02_GITHUB_SECRETS_SETUP.md](./02_GITHUB_SECRETS_SETUP.md)
**GitHub Actions Secrets 설정 가이드 (22개)**

분류별 시크릿:
- Docker Hub (2개): DOCKERHUB_USERNAME, DOCKERHUB_TOKEN
- AWS (5개): AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, EC2_SSH_PRIVATE_KEY, EC2_HOST
- Database (5개): POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, DB_HOST, DB_PORT
- Auth (5개): JWT_SECRET_KEY, KAKAO_CLIENT_ID/SECRET, GOOGLE_CLIENT_ID/SECRET
- External APIs (5개): OPENAI_API_KEY, PUBLIC_DATA_API_KEY, TOSS keys, KAKAO_MAP_KEY
- Email (2개): MAIL_USERNAME, MAIL_PASSWORD

각 시크릿의 설명, 현재 값, 배포 시 권장 값, 생성 방법 포함

#### 📋 [01_DEPLOYMENT_CHECKLIST.md](./01_DEPLOYMENT_CHECKLIST.md)
**단계별 배포 체크리스트**

5단계 구성:
- Phase 1: 선행 작업 (Docker Hub, AWS, EC2, S3 설정)
- Phase 2: GitHub Repository 설정 (22개 시크릿 등록)
- Phase 3: 배포 실행 (GitHub Actions 수동 실행)
- Phase 4: 배포 후 설정 (OAuth Redirect URI, 토스 결제)
- Phase 5: 모니터링 및 유지보수

#### 🔧 [.env.prod.example](../../.env.prod.example)
**EC2 서버용 환경변수 템플릿**

EC2의 `/opt/daypoo/.env` 파일로 복사하여 사용
docker-compose.prod.yml에 필요한 모든 환경변수 포함

---

## 📦 기존 인프라 확인

이미 구성되어 있는 파일들:

### Dockerfiles
- ✅ [backend/Dockerfile](backend/Dockerfile) - Java 21, Gradle 멀티스테이지 빌드
- ✅ [ai-service/Dockerfile](ai-service/Dockerfile) - Python 3.12, uvicorn

### Docker Compose
- ✅ [docker-compose.yml](docker-compose.yml) - 로컬 개발용
- ✅ [docker-compose.prod.yml](docker-compose.prod.yml) - 프로덕션용 (EC2)

### GitHub Actions Workflows
- ✅ [.github/workflows/deploy-aws.yml](.github/workflows/deploy-aws.yml) - AWS 배포 워크플로우
  - Job 1: Docker 이미지 빌드 및 푸시 (Backend + AI)
  - Job 2: 프론트엔드 빌드 및 S3 업로드
  - Job 3: EC2에 Docker 컨테이너 배포
- ✅ [.github/workflows/backend-ci.yml](.github/workflows/backend-ci.yml) - 백엔드 CI
- ✅ [.github/workflows/deploy.yml](.github/workflows/deploy.yml) - GitHub Pages 배포

---

## 🚀 다음 단계 (사용자가 해야 할 일)

### 1단계: AWS 계정 및 서비스 준비
```bash
# 필요한 것들:
- [ ] Docker Hub 계정 생성
- [ ] AWS 계정 생성 (프리티어)
- [ ] EC2 인스턴스 생성 (t2.micro)
- [ ] S3 버킷 생성 (daypoo-frontend)
- [ ] IAM 사용자 및 Access Key 생성
```

### 2단계: GitHub Secrets 등록
```bash
# Settings → Secrets and variables → Actions
# 총 22개 시크릿 등록 (02_GITHUB_SECRETS_SETUP.md 참고)
```

### 3단계: EC2 초기 설정
```bash
# EC2 SSH 접속
ssh -i daypoo-key.pem ec2-user@<EC2_PUBLIC_IP>

# Docker + Docker Compose 설치
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 작업 디렉토리 생성
sudo mkdir -p /opt/daypoo
sudo chown ec2-user:ec2-user /opt/daypoo

# .env 파일 생성 (.env.prod.example 참고)
cd /opt/daypoo
nano .env  # 내용 붙여넣기 및 수정

# docker-compose.prod.yml 복사
exit
scp -i daypoo-key.pem docker-compose.prod.yml ec2-user@<EC2_PUBLIC_IP>:/opt/daypoo/
```

### 4단계: GitHub Actions 배포 실행
```bash
# GitHub 웹사이트
# Actions 탭 → Deploy to AWS (DayPoo) → Run workflow
```

### 5단계: 배포 확인
```bash
# EC2 SSH 접속
ssh -i daypoo-key.pem ec2-user@<EC2_PUBLIC_IP>

# 컨테이너 확인
docker ps

# 헬스체크
curl http://localhost:8080/api/health
curl http://localhost:8000/health

# 브라우저 테스트
# http://<EC2_PUBLIC_IP>
```

---

## 📖 참고 문서

| 파일 | 설명 |
|------|------|
| [02_GITHUB_SECRETS_SETUP.md](./02_GITHUB_SECRETS_SETUP.md) | GitHub Actions Secrets 상세 가이드 |
| [01_DEPLOYMENT_CHECKLIST.md](./01_DEPLOYMENT_CHECKLIST.md) | 단계별 배포 체크리스트 |
| [.env.prod.example](../../.env.prod.example) | EC2 환경변수 템플릿 |
| [frontend/terraform.md](../../frontend/terraform.md) | 원본 배포 계획 및 Terraform 가이드 |

---

## ⚠️ 중요 보안 사항

### 배포 전 변경 필수:
1. **POSTGRES_PASSWORD**: 강력한 랜덤 비밀번호로 변경
   ```bash
   # 예: openssl rand -base64 32
   ```

2. **JWT_SECRET_KEY**: 256bit 이상 새 키 생성
   ```bash
   # 예: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

3. **TOSS_SECRET_KEY**: 테스트 키 → 라이브 키로 변경

### Git 커밋 금지:
- ❌ `.env` 파일
- ❌ `.pem` 키 파일
- ❌ 시크릿 값이 포함된 파일

---

## 🎉 완료 상태

### ✅ 완료된 것:
- [x] Frontend 수정 (GPS → homeRegion)
- [x] GitHub Actions 워크플로우 (deploy-aws.yml)
- [x] Dockerfiles (backend, ai-service)
- [x] docker-compose.prod.yml
- [x] 배포 문서 작성

### ⏳ 남은 것 (사용자가 해야 할 일):
- [ ] Docker Hub 계정 생성
- [ ] AWS 계정 및 EC2/S3 설정
- [ ] GitHub Secrets 22개 등록
- [ ] EC2 초기 설정 (Docker, .env 파일)
- [ ] GitHub Actions 배포 실행
- [ ] OAuth Redirect URI 업데이트

---

**작성일**: 2026-03-26
**작성자**: Claude Code (Opus 4.6)
**프로젝트**: DayPoo
**배포 대상**: AWS Free Tier

**다음 단계**: [01_DEPLOYMENT_CHECKLIST.md](./01_DEPLOYMENT_CHECKLIST.md) 를 따라 진행하세요! 🚀
