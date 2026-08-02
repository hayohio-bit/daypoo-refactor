## 릴리스 체크리스트

### 변경 내역 확인
- [ ] CHANGELOG.md 업데이트
- [ ] README.md 반영 (필요 시)
- [ ] INSTALL.md 반영 (필요 시)

### 품질 검증
- [ ] `bash tests/run-all.sh` 전체 통과
- [ ] 신규 스크립트 `bash -n` 문법 검사 통과

### 호환성
- [ ] 기존 명령어 인수·출력 위치 변경 없음
- [ ] `.shy-templates/` 배포 계약 유지
- [ ] `global-gitignore` 미변경 확인

### 배포
- [ ] 태그 생성: `git tag vX.Y.Z`
- [ ] 푸시: `git push origin main --tags`
