FROM postgres:15

# 데비안 패키지 매니저를 통해 PostGIS 3 라이브러리 직접 설치
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    postgresql-15-postgis-3 \
    postgresql-15-postgis-3-scripts && \
    rm -rf /var/lib/apt/lists/*
