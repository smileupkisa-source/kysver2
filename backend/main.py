from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="KISA Guide-On API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. 고정된 KSIC 데이터셋 (정확한 명칭과 코드 매칭)
KSIC_DATASET = [
    {"code": "10603", "name": "식료품 제조업 (과실 및 채소 절임)", "risk": 75},
    {"code": "10831", "name": "식초, 발효 및 화학 조미료 제조업", "risk": 70},
    {"code": "10110", "name": "도축업 (육가공)", "risk": 85},
    {"code": "10711", "name": "빵류 제조업", "risk": 65},
    {"code": "30111", "name": "승용차용 엔진 제조업", "risk": 90},
    {"code": "30121", "name": "승용차용 차체 제조업", "risk": 92},
    {"code": "25921", "name": "도금업 (표면처리)", "risk": 88},
    {"code": "25112", "name": "구조용 금속 판제품 제조업", "risk": 80},
    {"code": "41111", "name": "단독 주택 건설업", "risk": 95},
    {"code": "42111", "name": "도로 건설업", "risk": 94},
    {"code": "56111", "name": "한식 일반 음식점업", "risk": 45},
    {"code": "62010", "name": "컴퓨터 프로그래밍 서비스업", "risk": 20},
]

class DiagnosisRequest(BaseModel):
    business_name: str
    category_name: str
    ksic_code: str
    employee_count: int

class DiagnosisItem(BaseModel):
    title: str; is_target: bool; reason: str

class DiagnosisResult(BaseModel):
    items: List[DiagnosisItem]; risk_score: int

@app.get("/ksic/search")
def search_ksic(query: str):
    q = query.lower().replace(" ", "")
    # 명칭이나 코드에 키워드가 포함된 경우 모두 반환
    return [item for item in KSIC_DATASET if q in item["name"].lower().replace(" ", "") or q in item["code"]]

@app.post("/diagnosis", response_model=DiagnosisResult)
def perform_diagnosis(request: DiagnosisRequest):
    count = request.employee_count
    code = request.ksic_code
    industry = next((i for i in KSIC_DATASET if i["code"] == code), {"risk": 50})
    base_risk = industry["risk"]
    
    items = []
    is_mgr = count >= 50
    items.append({"title": "안전보건관리책임자 선임", "is_target": is_mgr, "reason": f"{count}명 기준: " + ("의무 대상" if is_mgr else "의무 없음")})
    is_sup = count >= 5
    items.append({"title": "관리감독자 지정", "is_target": is_sup, "reason": "5인 이상 사업장 필수"})
    is_safe = (count >= 50 and base_risk > 60) or code.startswith("41") or code.startswith("42")
    items.append({"title": "안전관리자 선임", "is_target": is_safe, "reason": f"위험도 {base_risk}점 및 규모 기준 적용"})
    is_com = count >= 100 or (count >= 50 and base_risk > 70)
    items.append({"title": "산업안전보건위원회 구성", "is_target": is_com, "reason": "규모/유해위험도 복합 판정"})

    final_score = int((base_risk * 0.7) + (min(count, 500) / 500 * 30))
    return {"items": items, "risk_score": min(final_score, 100)}

from fastapi.staticfiles import StaticFiles
import os

frontend_dist = os.path.join(os.path.dirname(__file__), "../frontend/dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
