# DayPoo TWA (Trusted Web Activity) Packaging

Google Play Console 등록용 안드로이드 앱 패키징(Bubblewrap) 프로젝트입니다.

상세한 가이드는 [docs/twa-playstore-guide.md](../docs/twa-playstore-guide.md)를 참고하십시오.

## 빠른 빌드 방법

```bash
# 1. Bubblewrap CLI 설치 (최초 1회)
npm install -g @bubblewrap/cli

# 2. AAB 빌드
bubblewrap build

# 3. 산출물 확인
# -> app-release-bundle.aab (Google Play Console 업로드용)
```
