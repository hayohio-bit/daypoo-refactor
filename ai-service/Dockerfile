FROM python:3.12-slim
WORKDIR /app

# 빌드 속도 향상을 위한 의존성 캐싱
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8000

# 0.0.0.0으로 호스트를 설정해야 컨테이너 외부(EC2)에서 접근 가능합니다.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
