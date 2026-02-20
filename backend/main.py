import os
import random
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="Azure AI Underwriting API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = Path(__file__).parent / "static"

# ── Models ──────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None

class ExtractedFields(BaseModel):
    applicant_name: str = ""
    date_of_birth: str = ""
    policy_type: str = ""
    coverage_amount: str = ""
    address: str = ""
    prior_claims_count: int = 0

class RiskRequest(BaseModel):
    applicant_name: str
    date_of_birth: str
    policy_type: str
    coverage_amount: str
    address: str
    prior_claims_count: int

class RiskResponse(BaseModel):
    risk_score: int
    risk_factors: list
    explanation: str
    recommendation: str

class DecisionRequest(BaseModel):
    submission_id: str
    decision: str
    notes: str = ""

class ChatRequest(BaseModel):
    submission_id: str
    message: str

# ── Demo Data ───────────────────────────────────────────────────────

DEMO_USER = {
    "email": os.environ.get("DEMO_EMAIL", "demo@insurance.com"),
    "password": os.environ.get("DEMO_PASSWORD", "change-me-in-env"),
}

def get_date(days_ago: int) -> str:
    return (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")

SUBMISSIONS = {
    "sub-001": {
        "id": "sub-001",
        "applicant_name": "Sarah Johnson",
        "date_of_birth": "1985-03-15",
        "policy_type": "Auto",
        "coverage_amount": "$50,000",
        "address": "123 Oak Lane, Austin, TX 78701",
        "prior_claims_count": 0,
        "risk_score": 22,
        "status": "Approved",
        "recommendation": "Approve",
        "explanation": "Sarah Johnson presents a very low risk profile for auto insurance. She has zero prior claims history and is requesting a moderate coverage amount. Her age and location further support a favorable risk assessment.",
        "risk_factors": [
            {"factor": "Zero prior claims", "impact": "positive"},
            {"factor": "Moderate coverage amount", "impact": "positive"},
            {"factor": "Stable residential address", "impact": "positive"}
        ],
        "date": get_date(1),
        "decision": "Approved",
        "notes": "Clean record, auto-approved by AI."
    },
    "sub-002": {
        "id": "sub-002",
        "applicant_name": "Michael Torres",
        "date_of_birth": "1978-11-22",
        "policy_type": "Property",
        "coverage_amount": "$750,000",
        "address": "456 River Rd, Miami, FL 33101",
        "prior_claims_count": 2,
        "risk_score": 74,
        "status": "Under Review",
        "recommendation": "Review",
        "explanation": "Michael Torres has a moderate-to-high risk profile for property insurance. The property is located in a flood-prone area of Miami, which significantly elevates the risk. Two prior claims in his history further warrant closer review before approval.",
        "risk_factors": [
            {"factor": "Flood-prone location (Miami)", "impact": "negative"},
            {"factor": "Two prior claims", "impact": "negative"},
            {"factor": "High coverage amount ($750K)", "impact": "negative"},
            {"factor": "Experienced homeowner (age 47)", "impact": "positive"}
        ],
        "date": get_date(2)
    },
    "sub-003": {
        "id": "sub-003",
        "applicant_name": "Emily Chen",
        "date_of_birth": "1992-07-08",
        "policy_type": "Life",
        "coverage_amount": "$250,000",
        "address": "789 Elm St, Seattle, WA 98101",
        "prior_claims_count": 0,
        "risk_score": 18,
        "status": "Approved",
        "recommendation": "Approve",
        "explanation": "Emily Chen is an excellent candidate for life insurance. At 33 years old with no prior claims, she represents a very low-risk applicant. The requested coverage amount is standard and well within typical approval ranges.",
        "risk_factors": [
            {"factor": "Young age (33)", "impact": "positive"},
            {"factor": "No prior claims", "impact": "positive"},
            {"factor": "Standard coverage amount", "impact": "positive"}
        ],
        "date": get_date(3),
        "decision": "Approved",
        "notes": "Low risk, auto-approved."
    },
    "sub-004": {
        "id": "sub-004",
        "applicant_name": "David Okafor",
        "date_of_birth": "1965-01-30",
        "policy_type": "Health",
        "coverage_amount": "$500,000",
        "address": "321 Pine Ave, Chicago, IL 60601",
        "prior_claims_count": 5,
        "risk_score": 88,
        "status": "Rejected",
        "recommendation": "Reject",
        "explanation": "David Okafor presents a high-risk profile for health insurance. At 61 years old with five prior claims, the historical pattern suggests continued high utilization. The requested coverage of $500,000 combined with the claims history exceeds acceptable risk thresholds.",
        "risk_factors": [
            {"factor": "Five prior claims", "impact": "negative"},
            {"factor": "Age 61 – higher health risk", "impact": "negative"},
            {"factor": "High coverage request ($500K)", "impact": "negative"},
            {"factor": "Urban area with good healthcare access", "impact": "positive"}
        ],
        "date": get_date(4),
        "decision": "Rejected",
        "notes": "Too many prior claims for coverage level requested."
    },
    "sub-005": {
        "id": "sub-005",
        "applicant_name": "Lisa Patel",
        "date_of_birth": "1990-09-12",
        "policy_type": "Auto",
        "coverage_amount": "$75,000",
        "address": "654 Maple Dr, Denver, CO 80201",
        "prior_claims_count": 1,
        "risk_score": 51,
        "status": "Under Review",
        "recommendation": "Review",
        "explanation": "Lisa Patel has a moderate risk profile for auto insurance. While she is relatively young and has only one prior claim, the higher-than-average coverage request warrants additional review. Overall, the application is borderline and could go either way.",
        "risk_factors": [
            {"factor": "One prior claim", "impact": "negative"},
            {"factor": "Above-average coverage ($75K)", "impact": "negative"},
            {"factor": "Young driver (35)", "impact": "positive"},
            {"factor": "Low-risk location (Denver)", "impact": "positive"}
        ],
        "date": get_date(5)
    },
}

# ── Endpoints ───────────────────────────────────────────────────────

@app.post("/api/login", response_model=LoginResponse)
def login(req: LoginRequest):
    if req.email == DEMO_USER["email"] and req.password == DEMO_USER["password"]:
        token = os.environ.get("DEMO_TOKEN", "demo-token")
        return LoginResponse(success=True, message="Login successful", token=token)
    raise HTTPException(status_code=401, detail="Invalid email or password")


@app.get("/api/dashboard")
def dashboard():
    submissions = [
        {
            "id": s["id"],
            "applicant_name": s["applicant_name"],
            "policy_type": s["policy_type"],
            "risk_score": s["risk_score"],
            "status": s["status"],
            "date": s["date"],
        }
        for s in SUBMISSIONS.values()
    ]
    return {
        "stats": {
            "submissions_this_week": 24,
            "auto_approved": 14,
            "flagged_for_review": 7,
            "rejected": 3,
        },
        "submissions": submissions,
    }


@app.get("/api/submissions/{submission_id}")
def get_submission(submission_id: str):
    if submission_id not in SUBMISSIONS:
        raise HTTPException(status_code=404, detail="Submission not found")
    return SUBMISSIONS[submission_id]


@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    """Mock Azure AI Document Intelligence extraction."""
    mock_extracted = {
        "applicant_name": {"value": "James Mitchell", "confidence": 0.97},
        "date_of_birth": {"value": "1988-06-14", "confidence": 0.95},
        "policy_type": {"value": "Property", "confidence": 0.92},
        "coverage_amount": {"value": "$400,000", "confidence": 0.98},
        "address": {"value": "1200 Sunset Blvd, Los Angeles, CA 90026", "confidence": 0.94},
        "prior_claims_count": {"value": 1, "confidence": 0.89},
    }
    return {"filename": file.filename, "fields": mock_extracted}


@app.post("/api/risk", response_model=RiskResponse)
def analyse_risk(req: RiskRequest):
    """Mock Azure OpenAI GPT-4 risk scoring."""
    score = _calculate_mock_risk(req)
    factors = _generate_risk_factors(req, score)
    explanation = _generate_explanation(req, score)
    recommendation = "Approve" if score < 40 else ("Review" if score < 70 else "Reject")

    new_id = f"sub-{uuid.uuid4().hex[:6]}"
    SUBMISSIONS[new_id] = {
        "id": new_id,
        "applicant_name": req.applicant_name,
        "date_of_birth": req.date_of_birth,
        "policy_type": req.policy_type,
        "coverage_amount": req.coverage_amount,
        "address": req.address,
        "prior_claims_count": req.prior_claims_count,
        "risk_score": score,
        "status": recommendation if recommendation == "Approve" else ("Under Review" if recommendation == "Review" else "Rejected"),
        "recommendation": recommendation,
        "explanation": explanation,
        "risk_factors": factors,
        "date": datetime.now().strftime("%Y-%m-%d"),
    }

    return RiskResponse(
        risk_score=score,
        risk_factors=factors,
        explanation=explanation,
        recommendation=recommendation,
    )


@app.post("/api/decision")
def submit_decision(req: DecisionRequest):
    if req.submission_id not in SUBMISSIONS:
        raise HTTPException(status_code=404, detail="Submission not found")
    sub = SUBMISSIONS[req.submission_id]
    sub["decision"] = req.decision
    sub["notes"] = req.notes
    sub["status"] = req.decision

    premium = None
    if req.decision == "Approved":
        base = int(sub.get("coverage_amount", "$100,000").replace("$", "").replace(",", ""))
        premium = round(base * (sub["risk_score"] / 100) * 0.05, 2)

    return {"success": True, "submission": sub, "premium": premium}


@app.post("/api/chat")
def copilot_chat(req: ChatRequest):
    """Mock Azure OpenAI Copilot chat."""
    sub = SUBMISSIONS.get(req.submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    response = _generate_chat_response(req.message, sub)
    return {"response": response}


# ── Helper functions ────────────────────────────────────────────────

def _calculate_mock_risk(req: RiskRequest) -> int:
    score = 30
    score += req.prior_claims_count * 15
    try:
        birth_year = int(req.date_of_birth.split("-")[0])
        age = datetime.now().year - birth_year
        if age > 60:
            score += 20
        elif age > 50:
            score += 10
        elif age < 25:
            score += 15
    except (ValueError, IndexError):
        pass
    amt = req.coverage_amount.replace("$", "").replace(",", "")
    try:
        if int(amt) > 500000:
            score += 15
        elif int(amt) > 200000:
            score += 5
    except ValueError:
        pass
    if req.policy_type.lower() == "health":
        score += 10
    elif req.policy_type.lower() == "property":
        score += 5
    return max(0, min(100, score + random.randint(-5, 5)))


def _generate_risk_factors(req: RiskRequest, score: int) -> list:
    factors = []
    if req.prior_claims_count == 0:
        factors.append({"factor": "No prior claims history", "impact": "positive"})
    elif req.prior_claims_count >= 3:
        factors.append({"factor": f"{req.prior_claims_count} prior claims – elevated risk", "impact": "negative"})
    else:
        factors.append({"factor": f"{req.prior_claims_count} prior claim(s) on record", "impact": "negative"})

    try:
        birth_year = int(req.date_of_birth.split("-")[0])
        age = datetime.now().year - birth_year
        if age > 55:
            factors.append({"factor": f"Applicant age ({age}) – higher risk bracket", "impact": "negative"})
        else:
            factors.append({"factor": f"Applicant age ({age}) – favorable demographics", "impact": "positive"})
    except (ValueError, IndexError):
        pass

    amt_str = req.coverage_amount.replace("$", "").replace(",", "")
    try:
        amt = int(amt_str)
        if amt > 500000:
            factors.append({"factor": f"High coverage amount ({req.coverage_amount})", "impact": "negative"})
        else:
            factors.append({"factor": f"Moderate coverage amount ({req.coverage_amount})", "impact": "positive"})
    except ValueError:
        pass

    factors.append({"factor": f"{req.policy_type} policy type", "impact": "positive" if score < 50 else "negative"})
    return factors


def _generate_explanation(req: RiskRequest, score: int) -> str:
    risk_level = "low" if score < 40 else ("moderate" if score < 70 else "high")
    try:
        birth_year = int(req.date_of_birth.split("-")[0])
        age = datetime.now().year - birth_year
    except (ValueError, IndexError):
        age = "unknown"

    return (
        f"{req.applicant_name} presents a {risk_level}-risk profile for {req.policy_type.lower()} insurance "
        f"with a score of {score} out of 100. "
        f"At age {age} with {req.prior_claims_count} prior claim(s) and a requested coverage of {req.coverage_amount}, "
        f"{'the application falls within acceptable parameters' if score < 40 else 'additional review is recommended' if score < 70 else 'the risk exceeds standard thresholds'}. "
        f"{'We recommend swift approval.' if score < 40 else 'A senior underwriter should evaluate before final decision.' if score < 70 else 'Declining or requiring significant conditions is advisable.'}"
    )


def _generate_chat_response(message: str, sub: dict) -> str:
    msg = message.lower()
    name = sub["applicant_name"]
    score = sub["risk_score"]

    if "risk factor" in msg or "biggest risk" in msg:
        factors = sub.get("risk_factors", [])
        neg = [f["factor"] for f in factors if f["impact"] == "negative"]
        if neg:
            return f"The primary risk factors for {name} are: {', '.join(neg)}. These contributed most to the risk score of {score}."
        return f"{name} has a very clean profile with no significant risk factors, resulting in a low score of {score}."

    if "compare" in msg or "typical" in msg:
        if score < 40:
            return f"With a risk score of {score}, {name} is well below the average approved applicant score of 35. This is a strong application that would typically be auto-approved."
        elif score < 70:
            return f"{name}'s score of {score} is above the average approved score of 35 but below the rejection threshold of 75. About 40% of similar applications are ultimately approved with conditions."
        else:
            return f"At {score}, {name}'s risk score is significantly above our typical approval range of 0-40. Only about 5% of applications with scores above 75 are approved, usually with substantial conditions."

    if "condition" in msg or "attach" in msg:
        if score < 40:
            return f"Given {name}'s low risk score of {score}, no special conditions are necessary. Standard policy terms should apply."
        elif score < 70:
            return f"For {name}, I'd recommend: (1) a higher deductible to offset the moderate risk, (2) annual policy review clause, and (3) requiring documentation of any changes in claims history."
        else:
            return f"If approving {name} despite the high score of {score}, consider: (1) significantly increased premium (30-50% above standard), (2) reduced coverage limits, (3) mandatory quarterly reviews, and (4) exclusion clauses for pre-existing risk factors."

    if "premium" in msg or "price" in msg or "cost" in msg:
        base = int(sub.get("coverage_amount", "$100,000").replace("$", "").replace(",", ""))
        est_premium = round(base * (score / 100) * 0.05, 2)
        return f"Based on {name}'s risk score of {score} and coverage of {sub['coverage_amount']}, the estimated annual premium would be ${est_premium:,.2f}. This accounts for the risk factors identified in the assessment."

    if "summary" in msg or "overview" in msg:
        return sub.get("explanation", f"{name} has a risk score of {score}.")

    return (
        f"Based on my review of {name}'s submission: they have a risk score of {score}/100 "
        f"with {sub.get('prior_claims_count', 0)} prior claim(s) for {sub.get('policy_type', 'unknown')} insurance "
        f"at {sub.get('coverage_amount', 'unknown')} coverage. "
        f"{'This is a strong application.' if score < 40 else 'This needs careful consideration.' if score < 70 else 'This is a high-risk application.'} "
        f"Feel free to ask about specific risk factors, comparisons, or recommended conditions."
    )


# ── Serve React static build ────────────────────────────────────────

if STATIC_DIR.is_dir():
    app.mount("/static", StaticFiles(directory=STATIC_DIR / "static"), name="static-assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        """Serve React SPA — return index.html for all non-API routes."""
        file_path = STATIC_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(STATIC_DIR / "index.html")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
