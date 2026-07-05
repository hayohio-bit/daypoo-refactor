import os
import json
import urllib.request
import urllib.error
import random
import time
from datetime import datetime, timezone, timedelta

API_BASE_URL = os.environ.get('API_BASE_URL', 'http://localhost:8080/api/v1')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
START_DATE = datetime(2026, 4, 1, tzinfo=timezone.utc) # 업그레이드 기준 날짜 (UTC 기준)

# 서울 주요 25개 거점 좌표 (자치구 랜드마크 중심)
SEOUL_HOTSPOTS = [
    {"name": "강남역", "lat": 37.4979, "lng": 127.0276},
    {"name": "홍대입구역", "lat": 37.5575, "lng": 126.9244},
    {"name": "잠실역", "lat": 37.5133, "lng": 127.1001},
    {"name": "서울역", "lat": 37.5547, "lng": 126.9707},
    {"name": "명동역", "lat": 37.5609, "lng": 126.9861},
    {"name": "시청역", "lat": 37.5665, "lng": 126.9780},
    {"name": "여의도역", "lat": 37.5216, "lng": 126.9242},
    {"name": "건대입구역", "lat": 37.5404, "lng": 127.0692},
    {"name": "성수역", "lat": 37.5446, "lng": 127.0559},
    {"name": "노원역", "lat": 37.6560, "lng": 127.0631},
    {"name": "수유역", "lat": 37.6384, "lng": 127.0255},
    {"name": "사당역", "lat": 37.4764, "lng": 126.9818},
    {"name": "신림역", "lat": 37.4842, "lng": 126.9297},
    {"name": "가산디지털단지역", "lat": 37.4812, "lng": 126.8827},
    {"name": "영등포역", "lat": 37.5156, "lng": 126.9076},
    {"name": "청량리역", "lat": 37.5801, "lng": 127.0441},
    {"name": "천호역", "lat": 37.5386, "lng": 127.1235},
    {"name": "연신내역", "lat": 37.6189, "lng": 126.9208},
    {"name": "마곡역", "lat": 37.5601, "lng": 126.8252},
    {"name": "고속터미널역", "lat": 37.5048, "lng": 127.0049},
    {"name": "종로3가역", "lat": 37.5704, "lng": 126.9921},
    {"name": "합정역", "lat": 37.5494, "lng": 126.9135},
    {"name": "혜화역", "lat": 37.5823, "lng": 127.0018},
    {"name": "회기역", "lat": 37.5898, "lng": 127.0580},
    {"name": "압구정역", "lat": 37.5271, "lng": 127.0285},
]

def do_request(method, path, data=None, token=None):
    url = f"{API_BASE_URL}{path}"
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    if token:
        headers['Authorization'] = f"Bearer {token}"
        
    req_data = None
    if data:
        req_data = json.dumps(data).encode('utf-8')
        
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            resp_body = response.read().decode('utf-8')
            if resp_body:
                try:
                    return json.loads(resp_body)
                except:
                    return resp_body
            return None
    except urllib.error.HTTPError as e:
        # Ignore 400 Bad Request if it's "Already exists email"
        error_body = e.read().decode('utf-8')
        if method == "POST" and "signup" in path and e.code == 400:
            return None
        print(f"HTTPError {e.code} on {path}: {error_body}")
        raise e
    except Exception as e:
        print(f"Request Error on {path}: {str(e)}")
        raise e

def get_openai_review(idx):
    # 80% 긍정, 20% 부정
    is_positive = random.random() < 0.8
    
    prompt = "공중화장실 리뷰를 1문장으로 짧게 적어줘. "
    if is_positive:
        prompt += "매우 깨끗하고 관리가 잘 되었다는 긍정적인 내용이어야 해. 이모지도 쓸 수 있으면 1개만 써."
    else:
        prompt += "휴지가 없거나 냄새가 나고 관리가 안 되었다는 비판적인 내용이어야 해. 너무 심한 욕설은 쓰지 마."
        
    if not OPENAI_API_KEY:
        pos_reviews = ["생각보다 너무 깔끔했어요!", "향기도 나고 관리 짱👍", "휴지 넉넉해서 좋았습니다.", "급할 때 구세주였어요!"]
        neg_reviews = ["너무 냄새나서 코 막고 썼습니다 ㅠ", "휴지통이 꽉 차서 넘쳐요...", "물비누가 안 나와요.", "청소가 시급합니다."]
        return random.choice(pos_reviews if is_positive else neg_reviews)
        
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}"
    }
    data = json.dumps({
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.8,
        "max_tokens": 50
    }).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            body = response.read().decode('utf-8')
            result = json.loads(body)
            return result['choices'][0]['message']['content'].strip()
    except Exception as e:
        print("OpenAI Error:", str(e))
        return "괜찮았어요."

def lambda_handler(event, context):
    print("AI Mega Simulation Bot Started")
    now_utc = datetime.now(timezone.utc)
    delta_days = (now_utc - START_DATE).days
    
    # 총 봇 수 계산 (초기 100개 + 1일당 5개씩 추가 생성)
    growth = max(0, delta_days) * 5
    total_bots = 100 + growth
    
    # 한 사이클당 전체의 약 50~70% 봇이 활동 (최소 40명 이상 활동 보장)
    active_bot_count = max(40, int(total_bots * random.uniform(0.5, 0.7)))
    selected_indices = random.sample(range(1, total_bots + 1), active_bot_count)
    
    print(f"Total available bots: {total_bots}, Executing {active_bot_count} bots for this cycle.")
    
    for bot_idx in selected_indices:
        email = f"bot_{bot_idx}@daypoo.com"
        password = "bot_password_123!"
        nickname = f"익명배변인_{bot_idx}"
        
        # 1. SignUp
        try:
            do_request("POST", "/auth/signup", {
                "email": email,
                "password": password,
                "nickname": nickname
            })
            print(f"Bot {bot_idx}: Signup Success")
        except Exception:
            pass
            
        # 2. Login
        token = None
        try:
            res = do_request("POST", "/auth/login", {"email": email, "password": password})
            if res and 'accessToken' in res:
                token = res['accessToken']
            elif res and 'data' in res and 'accessToken' in res['data']:
                token = res['data']['accessToken']
            
            if token:
                print(f"Bot {bot_idx}: Login Success")
        except Exception as e:
            print(f"Bot {bot_idx} login failed. Skipping.")
            continue
            
        if not token:
            continue
            
        # 3. Fetch toilets from random Seoul Hotspot
        spot = random.choice(SEOUL_HOTSPOTS)
        spot_name = spot["name"]
        toilet_id = None
        toilet_lat = spot["lat"]
        toilet_lng = spot["lng"]
        
        try:
            # 거점 중심에서 살짝씩 오차(약 3-5km 탐색)
            search_lat = toilet_lat + random.uniform(-0.03, 0.03)
            search_lng = toilet_lng + random.uniform(-0.03, 0.03)
            toilets = do_request("GET", f"/toilets?latitude={search_lat}&longitude={search_lng}&radius=5000", token=token)
            
            toilet_list = []
            if isinstance(toilets, list):
                toilet_list = toilets
            elif toilets and 'data' in toilets and isinstance(toilets['data'], list):
                toilet_list = toilets['data']
            elif toilets and 'content' in toilets:
                toilet_list = toilets['content']
                
            if toilet_list:
                t = random.choice(toilet_list)
                toilet_id = t.get('id')
                toilet_lat = t.get('latitude', search_lat)
                toilet_lng = t.get('longitude', search_lng)
        except Exception as e:
            print(f"Bot {bot_idx}: Toilet fetch failed at {spot_name}. Skipping activity.")
            continue

        if not toilet_id:
            print(f"Bot {bot_idx}: No toilets found at {spot_name}. Skipping activity.")
            continue

        # 4. Create Poo Record (Status logic)
        is_normal = random.random() < 0.75 # 봇은 비교적 건강하게 설정
        bristol_scale = random.randint(3, 4) if is_normal else random.choice([1, 2, 5, 6, 7])
        color = random.choice(["BROWN", "GOLD", "DARK_BROWN", "GREEN"]) if is_normal else random.choice(["RED", "BLACK", "PALE", "YELLOW"])
        condition_tags = ["GOOD", "NORMAL", "ENERGETIC"] if is_normal else ["TIRED", "STRESS", "HUNGRY"]
        diet_tags = ["VEGETABLE", "FRUIT", "WATER"] if is_normal else ["INSTANT", "MEAT", "COFFEE", "ALCOHOL"]
        
        try:
            do_request("POST", "/records", {
                "toiletId": toilet_id,
                "bristolScale": bristol_scale,
                "color": color,
                "conditionTags": condition_tags,
                "dietTags": diet_tags,
                "latitude": toilet_lat,
                "longitude": toilet_lng
            }, token)
            print(f"Bot {bot_idx}: Poo Record Success at {spot_name} (ID: {toilet_id})")
        except Exception as e:
            print(f"Bot {bot_idx}: Poo record failed.")
            
        # 5. Toilet Review
        try:
            review_text = get_openai_review(bot_idx)
            tags = ["clean", "tissue"] if "깨끗" in review_text or "좋" in review_text else ["dirty", "smell"]
            do_request("POST", f"/toilets/{toilet_id}/reviews", {
                "rating": random.randint(1, 5),
                "emojiTags": tags,
                "comment": review_text
            }, token)
            print(f"Bot {bot_idx}: Review Success at {spot_name}")
        except Exception as e:
            print(f"Bot {bot_idx}: Review failed.")
            
        # 6. CS Inquiry (1.5% chance)
        if random.random() < 0.015:
            try:
                do_request("POST", "/support/inquiries", {
                    "type": "OTHERS",
                    "title": f"[AI 정기점검] {spot_name} 주변 화장실 정보 추가 요청",
                    "content": f"안녕하세요 {nickname} 봇입니다. {spot_name} 근처에 화장실이 더 많아졌으면 좋겠어요. (자동 시뮬레이션 중)"
                }, token)
                print(f"Bot {bot_idx}: Inquiry Success")
            except Exception:
                pass
                
        # API 과부하 방지 딜레이 (0.5~1.0초 무작위)
        time.sleep(random.uniform(0.5, 1.0))

    print("AI Mega Simulation Bot Finished Execution")
    return {"statusCode": 200, "body": f"Successfully executed {active_bot_count} bots over Seoul."}

if __name__ == "__main__":
    lambda_handler(None, None)
