# scripts/init_opensearch_nori.ps1
# OpenSearch Nori 분석기 및 Geo-point 인덱스 클러스터 초기화 (PowerShell용)

# .env 파일에서 환경 변수 로드 (현재 폴더 또는 상위 폴더)
$envPath = ".env"
if (-not (Test-Path $envPath)) { $envPath = "..\.env" }

if (Test-Path $envPath) {
    Get-Content $envPath | Foreach-Object {
        if ($_ -match "^[^#\s]+=.*") {
            $parts = $_.Split('=', 2)
            $name = $parts[0].Trim()
            $value = $parts[1].Trim()
            [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

# OpenSearch URL 및 인증 정보 설정
$OS_URL = [System.Environment]::GetEnvironmentVariable("OPENSEARCH_URL")
if (-not $OS_URL) { $OS_URL = "http://localhost:9200" }
$INDEX_NAME = "toilets"

Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "OpenSearch Index Initialization (Nori + GeoPoint)"
Write-Host "Target URL: $OS_URL"
Write-Host "Index Name: $INDEX_NAME"
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan

# 1. 기존 인덱스 삭제
Write-Host "[Step 1] Deleting existing index..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Method Delete -Uri "$OS_URL/$INDEX_NAME" -ErrorAction SilentlyContinue
} catch {
    Write-Host "Index might not exist, skipping deletion." -ForegroundColor Gray
}

# 2. Nori 분석기 및 Mapping 설정이 포함된 신규 인덱스 생성
Write-Host "`n[Step 2] Creating new index with Nori configuration..." -ForegroundColor Yellow

$jsonBody = @"
{
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
}
"@

try {
    $response = Invoke-RestMethod -Method Put -Uri "$OS_URL/$INDEX_NAME" -ContentType "application/json" -Body $jsonBody
    Write-Host "`nSuccess: Index '$INDEX_NAME' was created successfully." -ForegroundColor Green
} catch {
    Write-Host "`nError: Failed to create index. Details: $_" -ForegroundColor Red
}

Write-Host "`n--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "Initialization complete. Now try running terraform apply!"
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
