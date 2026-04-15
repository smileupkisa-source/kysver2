from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import subprocess

app = FastAPI(title="산업안전보건 관계법령정보 분석 도구 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. 유해위험방지계획서 대상 13개 업종 (KSIC 코드 기반)
HAZARD_PREVENTION_INDUSTRIES = {
    "25": "금속가공제품 제조업; 기계 및 가구 제외",
    "20": "화학 물질 및 화학제품 제조업; 의약품 제외",
    "30": "자동차 및 트레일러 제조업",
    "24": "1차 금속 제조업",
    "29": "기타 기계 및 장비 제조업",
    "26": "전자부품, 컴퓨터, 영상, 음향 및 통신장비 제조업",
    "28": "전기장비 제조업",
    "27": "의료, 정밀, 광학기기 및 시계 제조업",
    "22": "고무 및 플라스틱제품 제조업",
    "23": "비금속 광물제품 제조업",
    "31": "기타 운송장비 제조업",
    "32": "가구 제조업",
    "10": "식료품 제조업"
}

# 2. 공정안전보고서(PSM) 대상 51개 유해물질 및 규정량 (일부 발췌, 주요 물질 포함)
# 규정량 단위: kg
PSM_SUBSTANCES = {
    "74-90-8": {"name": "시안화수소", "threshold": 1000},
    "75-21-8": {"name": "산화에틸렌", "threshold": 5000},
    "75-44-5": {"name": "포스겐", "threshold": 750},
    "7664-41-7": {"name": "암모니아", "threshold": 5000},
    "7782-50-5": {"name": "염소", "threshold": 1500},
    "1333-74-0": {"name": "수소", "threshold": 5000},
    "74-85-1": {"name": "에틸렌", "threshold": 5000},
    "74-98-6": {"name": "프로판", "threshold": 5000},
    "106-97-8": {"name": "부탄", "threshold": 5000},
    "67-56-1": {"name": "메탄올", "threshold": 5000},
    "64-17-5": {"name": "에탄올", "threshold": 5000},
    "110-54-3": {"name": "노말헥산", "threshold": 5000},
    "108-88-3": {"name": "톨루엔", "threshold": 5000},
    "1330-20-7": {"name": "자일렌", "threshold": 5000},
    "7664-93-9": {"name": "황산", "threshold": 20000},
    "7647-01-0": {"name": "염산", "threshold": 20000},
    "7697-37-2": {"name": "질산", "threshold": 20000},
    # 추가 51종 중 주요 위험물질 매핑...
}

# 3. 산업안전보건기준에 관한 규칙 별표1 (위험물질 분류)
APPENDIX_1_CLASSIFICATION = {
    "폭발성 물질 및 유기과산화물": ["니트로", "아조", "하이드라진", "과산화"],
    "물반응성 물질 및 인화성 고체": ["리튬", "나트륨", "칼륨", "황", "마그네슘"],
    "산화성 액체 및 산화성 고체": ["차아염소산", "아염소산", "염소산", "과염소산", "중크롬산", "과망간산"],
    "인화성 가스": ["수소", "아세틸렌", "에틸렌", "메탄", "에탄", "프로판", "부탄"],
    "인화성 액체": ["에틸에테르", "가솔린", "아세트알데히드", "메탄올", "에탄올", "아세톤", "벤젠", "톨루엔"],
    "급성독성물질": ["시안화수소", "포스겐", "불소", "염소", "암모니아", "염화수소", "질산"],
    "부식성 물질": ["황산", "질산", "염산", "인산", "아세산", "수산화나트륨", "수산화칼륨"]
}

class SubstanceInput(BaseModel):
    name_or_cas: str
    quantity: float

class AnalysisRequest(BaseModel):
    business_name: str
    ksic_code: str
    employee_count: int
    substances: List[SubstanceInput]

class DiagnosisItem(BaseModel):
    title: str
    is_target: bool
    reason: str

class AnalysisResult(BaseModel):
    items: List[DiagnosisItem]
    psm_r_value: float
    substance_classes: List[Dict[str, str]]
    risk_score: int

@app.get("/system/resources")
def get_system_resources():
    try:
        res = subprocess.run(['top', '-n', '1', '-b'], capture_output=True, text=True)
        lines = res.stdout.split('\n')
        cpu_usage, mem_usage = 0, 0
        for line in lines:
            if 'cpu' in line.lower() and 'idle' in line.lower():
                parts = line.split()
                for p in parts:
                    if 'idle' in p:
                        idle = int(p.replace('%idle', ''))
                        total_cpu = int(parts[0].replace('%cpu', ''))
                        cpu_usage = round(((total_cpu - idle) / total_cpu) * 100, 1)
            if 'Mem:' in line:
                parts = line.replace(',', '').split()
                total = int(parts[1].replace('M', ''))
                used = int(parts[3].replace('M', ''))
                mem_usage = round((used / total) * 100, 1)
        return {"cpu": cpu_usage, "memory": mem_usage}
    except:
        return {"cpu": 0, "memory": 0}

@app.post("/analyze", response_model=AnalysisResult)
def perform_analysis(request: AnalysisRequest):
    count = request.employee_count
    code = request.ksic_code
    items = []

    # 1. 안전보건관리체제 분석
    is_mgr = count >= 50
    items.append({"title": "안전보건관리책임자 선임", "is_target": is_mgr, "reason": f"상시근로자 {count}명 기준: " + ("의무 대상" if is_mgr else "의무 없음")})
    
    is_sup = count >= 5
    items.append({"title": "관리감독자 지정", "is_target": is_sup, "reason": "5인 이상 모든 사업장 필수 의무"})

    # 안전관리자 (건설업 50억 이상, 제조업 등 50인 이상)
    is_safe = count >= 50 or code.startswith(("20", "24", "25", "29", "30"))
    items.append({"title": "안전관리자 선임", "is_target": is_safe, "reason": "업종 위험도 및 상시근로자 규모 기준 판정"})

    # 2. 유해위험방지계획서 (13개 업종)
    is_hazard_plan = any(code.startswith(k) for k in HAZARD_PREVENTION_INDUSTRIES.keys())
    items.append({
        "title": "유해위험방지계획서 제출", 
        "is_target": is_hazard_plan, 
        "reason": f"입력된 업종({code})은 산업안전보건법에 따른 13개 주요 제조업 의무 대상에 " + ("포함됩니다." if is_hazard_plan else "포함되지 않습니다.")
    })

    # 3. PSM 및 R값 계산
    total_r_value = 0.0
    for sub in request.substances:
        # CAS NO 또는 이름으로 매칭
        match = PSM_SUBSTANCES.get(sub.name_or_cas)
        if not match:
            # 이름으로 검색
            for cas, data in PSM_SUBSTANCES.items():
                if sub.name_or_cas in data['name']:
                    match = data
                    break
        
        if match:
            total_r_value += (sub.quantity / match['threshold'])

    is_psm = total_r_value >= 1.0
    items.append({
        "title": "공정안전보고서(PSM) 작성", 
        "is_target": is_psm, 
        "reason": f"PSM 대상 물질 R값 합계: {round(total_r_value, 2)} (기준 1.0 이상 시 대상)"
    })

    # 4. 물질 분류 (별표 1)
    detected_classes = []
    for sub in request.substances:
        name = sub.name_or_cas.lower()
        for category, keywords in APPENDIX_1_CLASSIFICATION.items():
            if any(kw in name for kw in keywords):
                detected_classes.append({"substance": sub.name_or_cas, "class": category})

    # 종합 위험도 점수 계산
    base_score = 30 if is_psm else 10
    base_score += 20 if is_hazard_plan else 0
    final_score = min(int(base_score + (min(count, 300)/300 * 50)), 100)

    return {
        "items": items, 
        "psm_r_value": round(total_r_value, 3), 
        "substance_classes": detected_classes,
        "risk_score": final_score
    }

frontend_dist = os.path.join(os.path.dirname(__file__), "../frontend/dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
