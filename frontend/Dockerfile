# Build stage
FROM --platform=$BUILDPLATFORM node:20-alpine AS build-stage

WORKDIR /app

# Vite 빌드타임 환경변수 선언
ARG VITE_TOSS_CLIENT_KEY
ARG VITE_KAKAO_MAP_KEY

# package.json, package-lock.json 복사 (npm ci 캐시 최적화)
COPY package*.json ./

# 네이티브 모듈 빌드 의존성 설치 (gifsicle 등)
RUN apk add --no-cache python3 make g++ autoconf automake libtool pkgconfig nasm zlib-dev libpng-dev libjpeg-turbo-dev

# 의존성 설치
RUN npm ci

# 나머지 소스 복사
COPY . .

# Vite 빌드 (ARG → ENV 매핑으로 import.meta.env에 주입)
ENV VITE_TOSS_CLIENT_KEY=$VITE_TOSS_CLIENT_KEY
ENV VITE_KAKAO_MAP_KEY=$VITE_KAKAO_MAP_KEY
RUN npm run build

# Production stage
FROM nginx:alpine

# Nginx 설정 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드 결과물 복사
COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
