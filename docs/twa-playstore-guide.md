# DayPoo Google Play Store 출시 가이드 (TWA / Bubblewrap)

DayPoo PWA를 Google Play 스토어에 **TWA (Trusted Web Activity)** 기반의 안드로이드 앱 번들(AAB)로 패키징하여 배포하는 전체 절차 안내서입니다.

---

## 1. 사전 요구사항

1. **Node.js**: v18 이상
2. **JDK**: Java 17 또는 21 (JDK 환경 변수 `JAVA_HOME` 설정 필요)
3. **Android SDK & Build-tools**: Android Studio 설치 또는 Bubblewrap 자동 설치 지원
4. **Google Play Console 개발자 계정**: 등록 완료 상태

---

## 2. TWA 빌드 및 AAB(Android App Bundle) 생성

`twa/` 디렉터리에서 Google 공식 도구인 **Bubblewrap**을 사용해 빌드합니다.

### 2.1 Bubblewrap CLI 설치
```bash
# 전역 설치 (권장)
npm install -g @bubblewrap/cli

# 또는 twa 폴더 내 의존성 설치
cd twa
npm install
```

### 2.2 키스토어(Keystore) 생성 및 서명
빌드 시 사용할 서명 키(`android.keystore`)를 생성합니다:
```bash
keytool -genkey -v -keystore android.keystore -alias daypoo -keyalg RSA -keysize 2048 -validity 10000
```
> **주의**: 생성된 `android.keystore`와 비밀번호는 절대 분실하지 않도록 안전하게 보관하십시오 (Git 저장소에 커밋 금지).

### 2.3 AAB 빌드 실행
`twa/twa-manifest.json` 설정 파일이 이미 작성되어 있으므로 바로 빌드 명령어를 실행합니다:
```bash
cd twa
bubblewrap build
```
- 처음 실행 시 Android SDK 및 Build-tools 설치 경로를 묻는 프롬프트가 나타나면 기본값(Enter) 또는 설치된 SDK 경로를 지정합니다.
- 빌드가 완료되면 `app-release-bundle.aab` 파일이 생성됩니다.

---

## 3. Digital Asset Links (`assetlinks.json`) 인증 설정

TWA 앱이 상단 주소창(Chrome Custom Tabs) 없이 **완전한 네이티브 풀스크린**으로 동작하려면 웹 도메인과 앱 간의 소유권 연결이 필수적입니다.

### 3.1 SHA-256 서명 지문 추출

#### (1) 로컬 키스토어 지문 (테스트/내부 테스트용)
```bash
keytool -list -v -keystore android.keystore -alias daypoo
```
출력 결과 중 `Certificate fingerprints: SHA256: 00:AA:BB:...` 값을 복사합니다.

#### (2) Google Play App Signing 지문 (프로덕션 필수)
Google Play Console에 AAB를 업로드한 후:
1. **Google Play Console** 접속
2. 앱 선택 → **설정(Setup)** → **앱 서명(App signing)** 메뉴 이동
3. **앱 서명 키 인증서(App signing key certificate)**의 **SHA-256 인증서 지문** 복사

### 3.2 `assetlinks.json` 파일 갱신 및 배포
`frontend/public/.well-known/assetlinks.json` 파일에 추출한 SHA-256 지문을 추가합니다:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "site.eighto2.daypoo",
      "sha256_cert_fingerprints": [
        "PLAY_APP_SIGNING_SHA256_FINGERPRINT_HERE",
        "LOCAL_KEYSTORE_SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

### 3.3 웹 서버 배포 및 검증
웹 서버(`https://daypoo.8o2.site/.well-known/assetlinks.json`)에 배포된 후 Google 공식 도구로 연결 상태를 확인합니다:
- **검증 도구**: [Google Asset Links Tool](https://developers.google.com/digital-asset-links/tools/generator) 또는 `bubblewrap validate`

---

## 4. Google Play Console 등록 체크리스트

1. **앱 대시보드 기본 정보**:
   - 앱 이름: `DayPoo - 급똥 위치 기반 화장실 탐색`
   - 간단한 설명: `급할 때 가장 가까운 화장실을 1초 만에 찾아주는 급똥 SOS 앱. 전국 5만 개 화장실 실시간 지도.`
   - 기본 언어: 한국어 (`ko-KR`)
2. **그래픽 이미지 에셋**:
   - 앱 아이콘: `512 x 512 px` (32비트 PNG) → `frontend/public/icons/icon-512x512.png` 활용
   - 그래픽 이미지(피처 그래픽): `1024 x 500 px`
   - 휴대전화 스크린샷: 최소 2장 이상 (16:9 또는 9:16 비율)
3. **앱 콘텐츠 및 정책**:
   - 개인정보처리방침 URL: `https://daypoo.8o2.site/privacy` (필요 시 등록)
   - 타겟 연령층: 만 13세 이상 또는 전체 연령가
   - 카테고리: 라이프스타일 / 건강 및 피트니스 / 지도 및 내비게이션
   - 위치 정보 권한: 포그라운드 위치 권한 (내 주변 화장실 탐색 목적 명시)
4. **프로덕션 또는 비공개 테스트 트랙 출시**:
   - `twa/`에서 생성된 `app-release-bundle.aab`를 새 버전으로 업로드하고 심사 제출
