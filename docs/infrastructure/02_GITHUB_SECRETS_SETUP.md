# GitHub Actions Secrets 설정 가이드

DayPoo 프로젝트를 AWS에 배포하기 위해 GitHub Repository Settings > Secrets and variables > Actions에서 다음 시크릿을 등록해야 합니다.

## 📋 설정 위치
1. GitHub 저장소 페이지 접속
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Secrets and variables** > **Actions** 클릭
4. **New repository secret** 버튼으로 하나씩 추가

---

## 🐳 Docker Hub (이미지 저장소)

| Secret Name | 값 | 설명 |
|-------------|-----|------|
| `DOCKERHUB_USERNAME` | Docker Hub 사용자명 | Docker Hub 계정 ID |
| `DOCKERHUB_TOKEN` | Docker Hub Access Token | [hub.docker.com](https://hub.docker.com) → Account Settings → Security → New Access Token |

> ⚠️ **먼저 Docker Hub 가입 필요**: [https://hub.docker.com](https://hub.docker.com)

---

## ☁️ AWS 인증 (5개)

| Secret Name | 값 | 설명 |
|-------------|-----|------|
| `AWS_ACCESS_KEY_ID` | AWS IAM Access Key ID | AWS IAM 콘솔에서 생성 |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM Secret Access Key | AWS IAM 콘솔에서 생성 |
| `AWS_REGION` | `ap-northeast-2` | 서울 리전 고정 |
| `EC2_SSH_PRIVATE_KEY` | EC2 키페어 PEM 파일 전체 내용 | `-----BEGIN RSA PRIVATE KEY-----`부터 `-----END RSA PRIVATE KEY-----`까지 |
| `EC2_HOST` | EC2 Public IP 주소 | 예: `13.124.123.45` |

### AWS IAM 사용자 생성 방법:
1. AWS 콘솔 → IAM → Users → Create user
2. 권한: `AmazonS3FullAccess`, `AmazonEC2FullAccess`
3. Access keys → Create access key → CLI 선택
4. Access Key ID와 Secret Access Key 복사

### EC2 키페어 생성 방법:
1. EC2 콘솔 → Key Pairs → Create key pair
2. 이름: `daypoo-key` (원하는 이름)
3. File format: PEM
4. 다운로드된 `.pem` 파일을 텍스트 에디터로 열어 전체 내용 복사

---

## 🗄️ Database & Infrastructure (5개)

| Secret Name | 현재 .env 값 | 배포 시 권장 값 | 설명 |
|-------------|-------------|---------------|------|
| `POSTGRES_USER` | `daypoo` | `daypoo` | PostgreSQL 사용자명 |
| `POSTGRES_PASSWORD` | `daypoo1234` | **강력한 비밀번호로 변경** (예: 32자 랜덤) | PostgreSQL 비밀번호 |
| `POSTGRES_DB` | `daypoo_db` | `daypoo_db` | PostgreSQL 데이터베이스 이름 |
| `DB_HOST` | `localhost` | RDS Endpoint (Terraform 출력) | DB 호스트 주소 |
| `DB_PORT` | `5432` | `5432` | PostgreSQL 포트 |

---

## 🔐 Authentication & Security (5개)

| Secret Name | 현재 .env 값 | 배포 시 권장 |
|-------------|-------------|-------------|
| `JWT_SECRET_KEY` | Base64 인코딩 키 | **재생성 권장** (256bit 이상) |
| `KAKAO_CLIENT_ID` | `995eb9...` | 동일 (카카오 개발자 콘솔에서 복사) |
| `KAKAO_CLIENT_SECRET` | `9Xqw2Y...` | 동일 |
| `GOOGLE_CLIENT_ID` | `108781...` | 동일 (구글 클라우드 콘솔에서 복사) |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | 동일 |

### JWT 시크릿 키 생성 (Node.js):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### OAuth Redirect URI 업데이트 필요:
- **카카오**: 카카오 개발자 콘솔 → 내 애플리케이션 → 앱 설정 → 카카오 로그인 → Redirect URI
  - 추가: `https://your-cloudfront-domain.com/oauth/kakao/callback`
- **구글**: Google Cloud Console → APIs & Services → Credentials
  - Authorized redirect URIs에 추가: `https://your-cloudfront-domain.com/oauth/google/callback`

---

## 🌐 External APIs (5개)

| Secret Name | 현재 .env 값 | 설명 |
|-------------|-------------|------|
| `OPENAI_API_KEY` | `sk-proj-...` | AI 분석용 OpenAI API 키 |
| `PUBLIC_DATA_API_KEY` | `cbb85b...` | 공공데이터포털 API 키 |
| `TOSS_SECRET_KEY` | `test_sk_...` | 토스 결제 서버 키 (배포 시 live 키로 변경) |
| `VITE_TOSS_CLIENT_KEY` | `test_ck_...` | 토스 결제 클라이언트 키 |
| `VITE_KAKAO_MAP_KEY` | `09664c...` | 카카오맵 JavaScript 키 |

---

## 📧 Email (2개)

| Secret Name | 현재 .env 값 | 설명 |
|-------------|-------------|------|
| `MAIL_USERNAME` | `daypooadmin@gmail.com` | Gmail 계정 |
| `MAIL_PASSWORD` | Gmail 앱 비밀번호 | Gmail 2단계 인증 + 앱 비밀번호 생성 필요 |

### Gmail 앱 비밀번호 생성:
1. Google 계정 → 보안 → 2단계 인증 활성화
2. 보안 → 앱 비밀번호 → 메일 선택 → 기기 선택
3. 생성된 16자리 비밀번호 복사

---

## 📊 총 시크릿 개수: 22개

### 체크리스트:
- [ ] Docker Hub (2개): `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`
- [ ] AWS (5개): `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `EC2_SSH_PRIVATE_KEY`, `EC2_HOST`
- [ ] Database (5개): `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DB_HOST`, `DB_PORT`
- [ ] Auth (5개): `JWT_SECRET_KEY`, `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- [ ] External APIs (5개): `OPENAI_API_KEY`, `PUBLIC_DATA_API_KEY`, `TOSS_SECRET_KEY`, `VITE_TOSS_CLIENT_KEY`, `VITE_KAKAO_MAP_KEY`
- [ ] Email (2개): `MAIL_USERNAME`, `MAIL_PASSWORD`

---

## 🚀 배포 순서

1. **먼저 설정 (선행 작업)**:
   - [ ] Docker Hub 가입 및 Access Token 생성
   - [ ] AWS 계정 생성 및 IAM 사용자 설정
   - [ ] EC2 인스턴스 생성 및 키페어 다운로드

2. **GitHub Secrets 등록**:
   - [ ] 위 22개 시크릿을 GitHub Actions Secrets에 등록

3. **배포 실행**:
   - [ ] `main` 브랜치에 Push 또는 Actions 탭에서 수동 실행

4. **배포 후 확인**:
   - [ ] CloudFront URL로 프론트엔드 접속
   - [ ] OAuth Redirect URI 업데이트
   - [ ] `/api/health` 엔드포인트 확인

---

## ⚠️ 보안 주의사항

1. **절대 Git에 커밋하지 말 것**:
   - `.env` 파일
   - PEM 키 파일
   - 시크릿 값이 포함된 파일

2. **배포 시 변경 권장**:
   - `POSTGRES_PASSWORD`: 강력한 랜덤 비밀번호
   - `JWT_SECRET_KEY`: 새로 생성한 256bit 키
   - `TOSS_SECRET_KEY`, `TOSS_CLIENT_KEY`: 테스트 키 → 라이브 키

3. **주기적 교체**:
   - JWT 시크릿 키 (6개월마다)
   - DB 비밀번호 (3개월마다)
   - AWS Access Key (분기마다)

---

## 🆘 문제 해결

### 배포 실패 시 확인사항:
1. GitHub Actions 탭에서 로그 확인
2. 시크릿 이름 오타 확인 (대소문자 정확히)
3. EC2 보안 그룹에서 22번 포트(SSH) 허용 확인
4. Docker Hub에 이미지가 정상적으로 푸시되었는지 확인

### EC2 SSH 연결 실패:
- EC2_SSH_PRIVATE_KEY에 PEM 파일 **전체 내용** 복사했는지 확인
- EC2 보안 그룹에서 GitHub Actions IP 허용 (또는 전체 허용 `0.0.0.0/0`)
- EC2_HOST가 최신 Public IP인지 확인 (재시작 시 변경됨)

---

**작성일**: 2026-03-26
**프로젝트**: DayPoo
**배포 대상**: AWS Free Tier (EC2 + RDS + S3 + CloudFront)
