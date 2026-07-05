#!/bin/bash
# scripts/init_opensearch_nori.sh
# OpenSearch Nori 분석기 적용 인덱스 데이터 초기화 스크립트

# .env 파일에서 환경 변수 로드 (분석기 URL 및 인증 정보)
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# 기본값 설정
OS_URL=${OPENSEARCH_URL:-"http://localhost:9200"}
INDEX_NAME="toilets"

echo "--------------------------------------------------------"
echo "OpenSearch Index Initialization (Nori)"
echo "Target URL: $OS_URL"
echo "Index Name: $INDEX_NAME"
echo "--------------------------------------------------------"

# 1. 기존 인덱스 삭제
echo "[Step 1] Deleting existing index..."
curl -X DELETE "$OS_URL/$INDEX_NAME"

# 2. Nori 분석기가 적용된 신규 인덱스 생성 (사용자 요청 설정 반영)
echo -e "\n[Step 2] Creating new index with Nori configuration..."
curl -X PUT "$OS_URL/$INDEX_NAME" -H 'Content-Type: application/json' -d '{
  "settings": {
    "index": {
      "number_of_shards": 1,
      "number_of_replicas": 0
    },
    "analysis": {
      "tokenizer": {
        "kor_tokenizer": {
          "type": "nori_tokenizer",
          "decompound_mode": "mixed"
        }
      },
      "analyzer": {
        "nori_analyzer": {
          "type": "custom",
          "tokenizer": "kor_tokenizer",
          "filter": [
            "lowercase",
            "nori_readingform",
            "nori_part_of_speech"
          ]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "id": { "type": "long" },
      "name": { 
        "type": "text", 
        "analyzer": "nori_analyzer",
        "fields": {
          "keyword": { "type": "keyword", "ignore_above": 256 }
        }
      },
      "nameChosung": { "type": "keyword" },
      "address": { "type": "text", "analyzer": "nori_analyzer" },
      "addressChosung": { "type": "keyword" },
      "latitude": { "type": "double" },
      "longitude": { "type": "double" },
      "location": { "type": "geo_point" }
    }
  }
}'

echo -e "\n\n--------------------------------------------------------"
echo "Success: Index was recreated with Nori analyzer."
echo "Please restart backend server or trigger reindexing."
echo "--------------------------------------------------------"
