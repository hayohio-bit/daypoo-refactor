# 🎯 DayPoo OCI 배포 제품 명세서 (Product Specification Document)

이 문서는 DayPoo 프로젝트의 Oracle Cloud Infrastructure (OCI) 환경 배포를 위한 아키텍처 사양, 파이프라인 구성 및 크로스 플랫폼 빌드 최적화 방안을 정의합니다.

---

## 1. 개요 및 배경

DayPoo 서비스의 인프라를 AWS 프리티어에서 **OCI 프리티어 (Ampere A1 Compute)** 환경으로 이전 및 구축함에 따라, 서버 CPU 아키텍처가 x86_64(AMD64)에서 **ARM64**로 변경되었습니다. 

기존 GitHub Actions 빌드 파이프라인이 생성하는 Docker 이미지는 AMD64 아키텍처 단일 타겟이므로, ARM64 호스트인 OCI 기기에서 구동 시 다음과 같은 플랫폼 불일치 오류 및 성능 저하가 발생하게 되며, 결국 백엔드 헬스체크 통과에 실패합니다.
* **오류 메시지**: `The requested image's platform (linux/amd64) does not match the detected host platform (linux/arm64/v8)`
* **영향**: JVM 및 Node 에뮬레이션 지연으로 인한 컨테이너 실행 실패 및 헬스체크 타임아웃 (`unhealthy`).

이를 해결하기 위해 **Docker 멀티 플랫폼 빌드** 및 **크로스 컴파일 최적화**를 적용합니다.

---

## 2. 대상 인프라 및 배포 사양

### OCI 서버 인스턴스 사양
* **OS**: Ubuntu (22.04 LTS 이상)
* **아키텍처**: `linux/arm64/v8` (Ampere A1)
* **가상화 도구**: Docker Engine + Docker Compose v2 (플러그인 형태)

### 배포 토폴로지
```mermaid
flowchart TD
    subgraph OCI [Oracle Cloud Instance (ARM64)]
        frontend[daypoo-frontend:latest] --> backend[daypoo-backend:latest]
        backend --> postgres[(daypoo-postgres:15-alpine)]
        backend --> redis[(daypoo-redis:7-alpine)]
        backend --> ai[daypoo-ai:latest]
    end
    
    subgraph GitHub_Actions [GitHub Actions Runner (AMD64)]
        buildx[Docker Buildx + QEMU]
    end
    
    GitHub_Actions -- "Push Multi-Platform Images" --> DockerHub[(Docker Hub)]
    DockerHub -- "Pull ARM64 Images" --> OCI
```

---

## 3. 크로스 플랫폼 빌드 최적화 전략

GitHub Actions Runner(AMD64)에서 OCI 대상(ARM64) 이미지를 생성할 때, 전체 빌드 단계를 에뮬레이션으로 수행하면 빌드 시간이 극도로 늘어납니다. 이를 최적화하기 위해 **멀티 스테이지 빌드 컴파일 단계 분리** 기법을 적용합니다.

### 3.1 백엔드 (Spring Boot) 최적화
* **방안**: Gradle 컴파일 빌드 스테이지는 플랫폼과 관계없이 동일한 바이트코드(.jar)를 생성하므로, 호스트 아키텍처(`$BUILDPLATFORM`)를 사용하여 빠르게 네이티브 컴파일을 마칩니다. 런타임 패키징 스테이지에만 대상 아키텍처(ARM64) 베이스 이미지를 사용합니다.
* **Dockerfile 변경 예시**:
  ```dockerfile
  FROM --platform=$BUILDPLATFORM amazoncorretto:21-alpine AS builder
  ...
  RUN ./gradlew bootJar -x test
  
  FROM amazoncorretto:21-alpine
  COPY --from=builder /app/build/libs/*.jar app.jar
  ```

### 3.2 프론트엔드 (React / Vite) 최적화
* **방안**: 정적 리소스 빌드(Vite)는 플랫폼 독립적인 HTML/JS/CSS 결과물을 생성합니다. Node 빌드 단계를 호스트 아키텍처(`$BUILDPLATFORM`)에서 실행하고, 결과 정적 리소스를 대상 아키텍처의 Nginx 이미지로 이전합니다.
* **Dockerfile 변경 예시**:
  ```dockerfile
  FROM --platform=$BUILDPLATFORM node:20-alpine AS build-stage
  ...
  RUN npm run build
  
  FROM nginx:alpine
  COPY --from=build-stage /app/dist /usr/share/nginx/html
  ```

### 3.3 AI 서비스 (FastAPI)
* **방안**: 파이썬은 컴파일 단계가 별도로 요구되지 않으며, `pip`을 통한 패키지 다운로드 시 ARM64 호환 wheel 파일을 다이렉트로 내려받으므로 에뮬레이션 비용이 크지 않습니다. 따라서 단일 스테이지 멀티플랫폼 빌드를 적용합니다.

---

## 4. CI/CD 파이프라인 구성 (`deploy-oci.yml`)

워크플로우 파일에 **QEMU 설치**와 **Buildx 설정**을 내장하여 멀티 플랫폼 컴파일 환경을 정의합니다.

```yaml
# 1. 빌드 준비 단계에 추가
- name: Set up QEMU
  uses: docker/setup-qemu-action@v3

- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3

# 2. 이미지 빌드 시 platforms 명시
- name: Build and push Backend Image
  uses: docker/build-push-action@v5
  with:
    context: ./backend
    push: true
    platforms: linux/amd64,linux/arm64
    tags: ${{ secrets.DOCKERHUB_USERNAME }}/daypoo-backend:latest
```

---

## 5. 트러블슈팅 가이드

### 5.1 OOM (Out of Memory)으로 인한 컨테이너 Unhealthy
* **현상**: OCI 프리티어 인스턴스의 메모리가 부족하여 Spring Boot 애플리케이션 시작 도중 죽거나 헬스체크 응답에 실패함.
* **조치**: 
  1. 백엔드 JVM 최대 메모리 제한을 `-Xmx384m -Xms256m` 수준으로 고정합니다. (현재 `backend/Dockerfile`에 반영됨)
  2. 필요시 우분투 호스트 상에서 2GB~4GB 크기의 **Swap Memory** 설정을 권장합니다.
     ```bash
     sudo fallocate -l 2G /swapfile
     sudo chmod 600 /swapfile
     sudo mkswap /swapfile
     sudo swapon /swapfile
     echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
     ```

### 5.2 헬스체크 경로 호출 실패
* **현상**: docker-compose.prod.yml 내부의 healthcheck wget 경로가 응답하지 않음.
* **확인 사항**: 백엔드 포트(8080)와 Actuator 헬스 엔드포인트(`/actuator/health`) 활성화 여부를 확인합니다.
