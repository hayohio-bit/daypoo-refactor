# 문서 색인

DayPoo 저장소의 문서를 용도별로 정리한 색인이다. 새로 합류하거나 새 세션에서 작업을 이어받을 때 이 문서부터 읽는다.

## 필수 문서 (작업 전 읽기)

| 문서 | 내용 |
|---|---|
| [/CLAUDE.md](../CLAUDE.md) | 실행 절차, 빌드·테스트 명령, 아키텍처 개요. 로컬 환경 제약(카카오맵 5173 포트 등) 포함 |
| [refactoring-plan.md](./refactoring-plan.md) | **현재 진행 중인 리팩토링 백로그의 단일 출처.** 우선순위(P0~P3), 각 항목의 파일:라인 근거, 완료 항목의 커밋 해시 |
| [Project_Architecture_Blueprint.md](./Project_Architecture_Blueprint.md) | 시스템 아키텍처, 구성요소, 데이터 흐름, 개발 규칙 종합 |

## 스펙·설계 문서

| 문서 | 내용 |
|---|---|
| [architecture/backend-detailed-design.md](./architecture/backend-detailed-design.md) | 백엔드 상세 설계 |
| [architecture/detailed_design.md](./architecture/detailed_design.md) | 전체 상세 설계 |
| [api-docs.md](./api-docs.md) | OpenAPI(Swagger) 명세 안내 — 실제 명세는 서버 기동 후 `/api/docs` |
| [local-run-guide.md](./local-run-guide.md) | 로컬 실행 절차, 화면별 사용 방법과 스크린샷, 포트 충돌 등 자주 겪는 문제 |

## 인프라·배포

| 문서 | 내용 |
|---|---|
| [infrastructure/01_DEPLOYMENT_CHECKLIST.md](./infrastructure/01_DEPLOYMENT_CHECKLIST.md) | 배포 체크리스트 |
| [infrastructure/02_GITHUB_SECRETS_SETUP.md](./infrastructure/02_GITHUB_SECRETS_SETUP.md) | GitHub Secrets 설정 |
| [infrastructure/03_DEPLOYMENT_SUMMARY.md](./infrastructure/03_DEPLOYMENT_SUMMARY.md) | 배포 요약 |
| [infrastructure/04_OCI_DEPLOYMENT_SPEC.md](./infrastructure/04_OCI_DEPLOYMENT_SPEC.md) | OCI 배포 사양 |
| [twa-playstore-guide.md](./twa-playstore-guide.md) | TWA Play Store 패키징 가이드 |

## 참고 자료

| 문서 | 내용 |
|---|---|
| [reference/project-structure-analysis.md](./reference/project-structure-analysis.md) | 프로젝트 구조 분석 |
| [architecture/2026-03-03-poo-map.canvas](./architecture/2026-03-03-poo-map.canvas) | 지도 기능 설계 캔버스 (Obsidian) |

## 문서 관리 규칙

- 리팩토링 진행 상태는 `refactoring-plan.md`에만 기록한다 (체크박스 + 커밋 해시). 다른 문서에 진행 상태를 중복 기록하지 않는다.
- 새 문서를 추가하면 이 색인에도 한 줄을 추가한다.
