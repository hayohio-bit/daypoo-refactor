# Daypoo OpenAPI (Swagger) 명세 안내

본 프로젝트는 `springdoc-openapi`를 사용하여 API 명세를 자동화하고 있습니다.
1차 개선(발표 대비)을 통해 핵심 API의 한글 설명과 명확성을 대폭 보강하였습니다.

## 접속 URL

서버 실행 후 아래 주소로 접속하여 대화형 문서(Swagger UI)를 확인할 수 있습니다.

- **Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **OpenAPI JSON 스펙**: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)
- **OpenAPI YAML 스펙**: [http://localhost:8080/v3/api-docs.yaml](http://localhost:8080/v3/api-docs.yaml)

## 주요 발표용 핵심 API 타겟 (`@Tag`)

- **Toilet / Emergency**: 반경 내 화장실 조회 및 급똥(가장 가까운 화장실) 추천
- **Poo Records**: 배변 기록 생성(위치 인증 포함), 체크인, 분석 결과
- **Ranking**: 글로벌, 지역별, 건강왕(장 컨디션) 랭킹 조회
- **Report**: AI 배변 패턴 리포트(DAILY, WEEKLY, MONTHLY) 생성 및 조회

> 프론트엔드 연동용 클라이언트 코드 자동 생성(Swagger Codegen, Orval 등)이 필요한 경우, 
> 위 JSON/YAML 스펙 URL을 타겟으로 하여 스크립트를 구성하시면 됩니다.
