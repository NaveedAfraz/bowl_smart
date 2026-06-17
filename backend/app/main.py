"""
BowlSmart Backend — AI-Powered Fast Bowling Analysis Service

This FastAPI service handles:
1. Video ingestion & validation
2. MediaPipe pose detection (33 body landmarks per frame)
3. Bowling phase detection (run-up → follow-through)
4. Biomechanics calculations (angles, velocities, alignment)
5. Injury risk scoring
6. Form scoring per phase
7. Gemini API report generation with drill recommendations
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
import uuid
# Trigger reload: env key updated and groq disabled (thinking budget zero added)
import os
import asyncio
import numpy as np

from app.config import settings
from app.services.video_processor import VideoProcessor
from app.services.pose_detector import PoseDetector
from app.services.phase_detector import PhaseDetector
from app.services.biomechanics import BiomechanicsCalculator
from app.services.injury_scorer import InjuryScorer
from app.services.form_scorer import FormScorer
from app.services.report_generator import ReportGenerator
from app.services.video_annotator import VideoAnnotator
from app.services.coach_chat import CoachChat

app = FastAPI(
    title="BowlSmart API",
    description="AI-powered cricket fast bowling analysis backend",
    version="1.0.0",
)

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "https://bowl-smart.vercel.app",
        os.environ.get("FRONTEND_URL", "http://localhost:3000"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads and annotated videos directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
ANNOTATED_DIR = os.path.join(os.path.dirname(settings.UPLOAD_DIR), "annotated_videos")
os.makedirs(ANNOTATED_DIR, exist_ok=True)

# Simple JSON database for persistence
DB_PATH = os.path.join(settings.UPLOAD_DIR, "jobs_db.json")

def load_jobs():
    import json
    if os.path.exists(DB_PATH):
        try:
            with open(DB_PATH, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_jobs():
    import json
    with open(DB_PATH, "w") as f:
        json.dump(analysis_jobs, f)

analysis_jobs: dict = load_jobs()

SQUADS_DB_PATH = os.path.join(settings.UPLOAD_DIR, "squads_db.json")
def load_squads():
    import json
    if os.path.exists(SQUADS_DB_PATH):
        try:
            with open(SQUADS_DB_PATH, "r") as f:
                return json.load(f)
        except Exception:
            pass
            
    # Seed data if no DB exists
    return {
        "squads": {
            "squad_1": {
                "id": "squad_1",
                "coach_id": "coach_1",
                "name": "Elite Fast Bowling Academy",
                "invite_code": "a3f9c2b1",
                "created_at": "2026-06-01T00:00:00Z"
            }
        },
        "members": [
            {"squad_id": "squad_1", "bowler_id": "bowler_1", "name": "Rahul Dravid Jr.", "form": 82, "pace": 138, "risk": 28},
            {"squad_id": "squad_1", "bowler_id": "bowler_2", "name": "Arjun Sharma", "form": 71, "pace": 131, "risk": 55},
            {"squad_id": "squad_1", "bowler_id": "bowler_3", "name": "Dev Patel", "form": 64, "pace": 127, "risk": 72},
            {"squad_id": "squad_1", "bowler_id": "bowler_4", "name": "Kiran Bose", "form": 78, "pace": 134, "risk": 33},
            {"squad_id": "squad_1", "bowler_id": "bowler_5", "name": "Siddharth Rao", "form": 69, "pace": 129, "risk": 41}
        ]
    }

def save_squads():
    import json
    with open(SQUADS_DB_PATH, "w") as f:
        json.dump(squads_db, f)

squads_db = load_squads()

# Coach chat instance (shared across requests)
coach_chat = CoachChat()

def convert_numpy(obj):
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: convert_numpy(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy(v) for v in obj]
    elif isinstance(obj, tuple):
        return tuple(convert_numpy(v) for v in obj)
    return obj


class BowlerProfile(BaseModel):
    age: int
    height_cm: float
    weight_kg: float
    dominant_arm: str  # "right" or "left"
    bowling_style: str  # "seam", "swing", "express_pace"
    experience_level: str  # "beginner", "club", "academy", "professional"
    self_reported_pace: Optional[float] = None
    pace_unit: str = "kmh"
    existing_injuries: list[str] = []
    goals: list[str] = []


class AnalysisStatus(BaseModel):
    job_id: str
    status: str  # "processing", "complete", "failed"
    progress: int  # 0-100
    current_step: str
    result: Optional[dict] = None
    error: Optional[str] = None


@app.get("/health")
async def health_check_root():
    return {
        "status": "healthy",
        "service": "bowlsmart-analysis",
        "version": "1.0.0",
        "gemini_configured": bool(settings.GEMINI_API_KEY),
    }


@app.get("/api/health")
async def health_check_api():
    return {
        "status": "healthy",
        "service": "bowlsmart-analysis",
        "version": "1.0.0",
        "gemini_configured": bool(settings.GEMINI_API_KEY),
    }


@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "bowlsmart-analysis",
        "version": "1.0.0",
        "gemini_configured": bool(settings.GEMINI_API_KEY),
    }


@app.post("/api/v1/analyze")
async def start_analysis(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    age: int = Form(22),
    height_cm: float = Form(180),
    weight_kg: float = Form(75),
    dominant_arm: str = Form("right"),
    bowling_style: str = Form("seam"),
    experience_level: str = Form("club"),
    self_reported_pace: Optional[float] = Form(None),
    camera_angle: str = Form("side_on"),
    user_id: Optional[str] = Form(None),
):
    """Upload a bowling video and start the analysis pipeline."""

    job_id = str(uuid.uuid4())

    # Save uploaded video temporarily
    upload_dir = os.path.join(settings.UPLOAD_DIR, job_id)
    os.makedirs(upload_dir, exist_ok=True)
    video_path = os.path.join(upload_dir, video.filename or "bowling_video.mp4")

    with open(video_path, "wb") as f:
        content = await video.read()
        f.write(content)

    # Build bowler profile
    bowler_profile = BowlerProfile(
        age=age,
        height_cm=height_cm,
        weight_kg=weight_kg,
        dominant_arm=dominant_arm,
        bowling_style=bowling_style,
        experience_level=experience_level,
        self_reported_pace=self_reported_pace,
    )

    # Initialize job status
    analysis_jobs[job_id] = {
        "status": "processing",
        "progress": 0,
        "current_step": "Initializing...",
        "result": None,
        "error": None,
        "user_id": user_id,
    }

    # Run analysis in background
    background_tasks.add_task(
        run_analysis_pipeline, job_id, video_path, bowler_profile, camera_angle
    )

    return {"job_id": job_id, "status": "processing"}


@app.get("/api/v1/analyze/{job_id}/status")
async def get_analysis_status(job_id: str):
    """Check the status of a running analysis."""
    if job_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Analysis job not found")

    job = analysis_jobs[job_id]
    return AnalysisStatus(job_id=job_id, **job)


@app.get("/api/v1/analyze/{job_id}/video")
async def get_annotated_video(job_id: str):
    """Serve the annotated skeleton-overlay video for a completed analysis."""
    if job_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Analysis job not found")

    job = analysis_jobs[job_id]
    if job["status"] != "complete":
        raise HTTPException(status_code=400, detail="Analysis not complete")

    video_path = job.get("annotated_video_path")
    if not video_path or not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Annotated video not available")

    return FileResponse(video_path, media_type="video/mp4", filename=f"bowlsmart_{job_id}.mp4")


@app.get("/api/v1/analyze/{job_id}/result")
async def get_analysis_result(job_id: str):
    """Get the full result of a completed analysis."""
    if job_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Analysis job not found")

    job = analysis_jobs[job_id]
    if job["status"] != "complete":
        raise HTTPException(
            status_code=400,
            detail=f"Analysis not complete. Status: {job['status']}",
        )

    return job["result"]


@app.get("/api/v1/reports")
async def list_reports(user_id: Optional[str] = None):
    """List all completed analysis reports."""
    reports = []
    for job_id, job in analysis_jobs.items():
        if user_id and job.get("user_id") != user_id:
            continue
            
        if job["status"] == "complete" and job.get("result"):
            res = job["result"]
            reports.append({
                "id": job_id,
                "date": res.get("date", "Today"),
                "overall_score": res.get("overall_score", 0),
                "current_pace": res.get("bowler_profile", {}).get("self_reported_pace", 125) or 125,
                "injury_risk": res.get("injury_risk", {}).get("overall_risk", 0),
                "risk_level": res.get("injury_risk", {}).get("risk_level", "Unknown"),
                "drills": res.get("ai_report", {}).get("recommended_drills", [])
            })
    # Return latest first
    return {"reports": reports[::-1]}


@app.get("/api/v1/reports/{job_id}/keypoints")
async def get_report_keypoints(job_id: str):
    """Get keypoint timeseries for rendering the Before vs After skeleton comparison."""
    if job_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Analysis job not found")
        
    job = analysis_jobs[job_id]
    if job["status"] != "complete":
        raise HTTPException(status_code=400, detail="Analysis not complete")
        
    res = job.get("result", {})
    return {
        "id": job_id,
        "recordedAt": res.get("date", ""),
        "rawKeypoints": res.get("raw_keypoints", []),
        "phaseFrames": res.get("phase_frames", {}),
        "biomechanics": res.get("biomechanics", {}),
        "formScore": res.get("overall_score", 0),
        "paceKmh": res.get("bowler_profile", {}).get("self_reported_pace", 0),
        "injuryRiskScore": res.get("injury_risk", {}).get("overall_risk", 0)
    }

@app.get("/api/v1/reports/{job_id_a}/compare/{job_id_b}")
async def compare_reports(job_id_a: str, job_id_b: str):
    """Compute and return deltas between two analysis reports."""
    if job_id_a not in analysis_jobs or job_id_b not in analysis_jobs:
        raise HTTPException(status_code=404, detail="One or both reports not found")
        
    job_a = analysis_jobs[job_id_a]
    job_b = analysis_jobs[job_id_b]
    
    if job_a["status"] != "complete" or job_b["status"] != "complete":
        raise HTTPException(status_code=400, detail="Both analyses must be complete")
        
    res_a = job_a.get("result", {})
    res_b = job_b.get("result", {})
    
    # Compute Deltas matching actual biomechanics payload structure
    metrics = [
        {"key": "lateral_trunk_flexion", "group": "joint_angles", "sub": "ffc", "label": "Lateral trunk flexion", "unit": "°", "higherIsBetter": False, "phase": "front_foot_contact"},
        {"key": "front_knee_angle", "group": "joint_angles", "sub": "ffc", "label": "Front knee angle", "unit": "°", "higherIsBetter": True, "phase": "front_foot_contact"},
        {"key": "hip_shoulder_separation", "group": "body_alignment", "sub": "ffc", "label": "Hip-shoulder separation", "unit": "°", "higherIsBetter": True, "phase": "front_foot_contact"},
        {"key": "bowling_arm_elbow_angle", "group": "joint_angles", "sub": "delivery", "label": "Elbow angle", "unit": "°", "higherIsBetter": True, "phase": "release"},
        {"key": "run_up_speed_normalized", "group": "velocity_timing", "sub": None, "label": "Run-up speed", "unit": "m/s", "higherIsBetter": True, "phase": "run_up"},
        {"key": "estimated_pace_kmh", "group": "aggregate", "sub": None, "label": "Pace", "unit": "km/h", "higherIsBetter": True, "phase": "aggregate"},
        {"key": "form_score", "group": "aggregate", "sub": None, "label": "Form score", "unit": "", "higherIsBetter": True, "phase": "aggregate"},
        {"key": "injury_risk_score", "group": "aggregate", "sub": None, "label": "Injury risk", "unit": "", "higherIsBetter": False, "phase": "aggregate"},
    ]
    
    deltas = []
    for m in metrics:
        key = m["key"]
        group = m["group"]
        sub = m["sub"]
        
        def get_val(res):
            if group == "aggregate":
                if key == "estimated_pace_kmh":
                    return res.get("bowler_profile", {}).get("self_reported_pace", 0)
                elif key == "form_score":
                    return res.get("overall_score", 0)
                elif key == "injury_risk_score":
                    return res.get("injury_risk", {}).get("overall_risk", 0)
            
            b = res.get("biomechanics", {})
            if group in b:
                if sub and sub in b[group]:
                    return b[group][sub].get(key, 0)
                elif not sub:
                    return b[group].get(key, 0)
            return 0
            
        vA = get_val(res_a)
        vB = get_val(res_b)
            
        vA = float(vA) if vA is not None else 0.0
        vB = float(vB) if vB is not None else 0.0
        delta = vB - vA
        improved = (delta > 0) if m["higherIsBetter"] else (delta < 0)
        
        deltas.append({
            "key": key,
            "label": m["label"],
            "unit": m["unit"],
            "phase": m["phase"],
            "vA": vA,
            "vB": vB,
            "delta": delta,
            "improved": improved
        })

    return {
        "reportA": {
            "id": job_id_a,
            "recordedAt": res_a.get("date", ""),
            "formScore": res_a.get("overall_score", 0),
            "biomechanics": res_a.get("biomechanics", {})
        },
        "reportB": {
            "id": job_id_b,
            "recordedAt": res_b.get("date", ""),
        "formScore": res_b.get("overall_score", 0),
            "biomechanics": res_b.get("biomechanics", {})
        },
        "deltas": deltas
    }

# ── Squads & Coaching API ────────────────────────────────────────────────
import datetime

class SquadCreateRequest(BaseModel):
    name: str
    coach_id: str

@app.post("/api/v1/squads")
async def create_squad(req: SquadCreateRequest):
    import uuid
    import hashlib
    squad_id = str(uuid.uuid4())
    # Generate 8-char invite code
    invite_code = hashlib.md5(squad_id.encode()).hexdigest()[:8]
    
    squads_db["squads"][squad_id] = {
        "id": squad_id,
        "coach_id": req.coach_id,
        "name": req.name,
        "invite_code": invite_code,
        "created_at": datetime.datetime.now().isoformat()
    }
    save_squads()
    return squads_db["squads"][squad_id]

@app.get("/api/v1/squads")
async def list_squads(user_id: str):
    res = []
    # Check if coach
    for s_id, squad in squads_db["squads"].items():
        if squad["coach_id"] == user_id:
            squad_info = dict(squad)
            squad_info["role"] = "coach"
            res.append(squad_info)
            
    # Check if member
    for m in squads_db["members"]:
        if m["bowler_id"] == user_id:
            squad = squads_db["squads"].get(m["squad_id"])
            if squad:
                squad_info = dict(squad)
                squad_info["role"] = "member"
                res.append(squad_info)
                
    return res

class SquadJoinRequest(BaseModel):
    invite_code: str
    bowler_id: str
    name: str

@app.post("/api/v1/squads/join")
async def join_squad(req: SquadJoinRequest):
    # Find squad
    squad = None
    for s in squads_db["squads"].values():
        if s["invite_code"] == req.invite_code:
            squad = s
            break
            
    if not squad:
        raise HTTPException(status_code=404, detail="Invalid invite code")
        
    # Check if already a member
    for m in squads_db["members"]:
        if m["squad_id"] == squad["id"] and m["bowler_id"] == req.bowler_id:
            return {"squad": squad, "status": "already_joined"}
            
    # Add member
    squads_db["members"].append({
        "squad_id": squad["id"],
        "bowler_id": req.bowler_id,
        "name": req.name,
        "form": 0,
        "pace": 0,
        "risk": 0
    })
    save_squads()
    return {"squad": squad, "status": "joined"}

@app.get("/api/v1/squads/{squad_id}/dashboard")
async def get_squad_dashboard(squad_id: str):
    if squad_id not in squads_db["squads"]:
        raise HTTPException(status_code=404, detail="Squad not found")
        
    squad = squads_db["squads"][squad_id]
    
    # Get members
    members = [m for m in squads_db["members"] if m["squad_id"] == squad_id]
    
    bowlers_data = []
    alerts = []
    
    for m in members:
        # Since this is a demo, we use the seeded metrics directly
        # In a real app we would query analysis_jobs for the latest reports for m['bowler_id']
        formScore = m.get("form", 0)
        paceKmh = m.get("pace", 0)
        injuryRisk = m.get("risk", 0)
        
        latest = None
        if formScore > 0:
            latest = {
                "id": "mock_latest",
                "recordedAt": datetime.datetime.now().isoformat(),
                "formScore": formScore,
                "paceKmh": paceKmh,
                "injuryRiskScore": injuryRisk
            }
            
        # Mock previous session
        previous = None
        if formScore > 0:
            previous = {
                "id": "mock_prev",
                "recordedAt": (datetime.datetime.now() - datetime.timedelta(days=2)).isoformat(),
                "formScore": formScore + 5, # Assume form dropped
                "paceKmh": paceKmh,
                "injuryRiskScore": injuryRisk - 20 # Assume risk spiked
            }
            
        bowler_alerts = []
        if latest and previous:
            # Injury spike > 15 points
            if latest["injuryRiskScore"] - previous["injuryRiskScore"] > 15:
                bowler_alerts.append({
                    "type": "injury_spike",
                    "bowlerName": m["name"],
                    "message": f"{m['name']}'s injury risk jumped from {previous['injuryRiskScore']} to {latest['injuryRiskScore']}",
                    "severity": "high"
                })
            # Form drop
            if previous["formScore"] - latest["formScore"] > 4:
                bowler_alerts.append({
                    "type": "form_drop",
                    "bowlerName": m["name"],
                    "message": f"{m['name']}'s form dropped {previous['formScore'] - latest['formScore']} points",
                    "severity": "medium"
                })
        
        alerts.extend(bowler_alerts)
        
        trend = "flat"
        if latest and previous:
            delta = latest["formScore"] - previous["formScore"]
            if delta > 3: trend = "up"
            elif delta < -3: trend = "down"
            
        bowlers_data.append({
            "bowler": {"id": m["bowler_id"], "name": m["name"]},
            "latest": latest,
            "trend": trend,
            "alerts": bowler_alerts
        })
        
    return {
        "squad": squad,
        "bowlers": bowlers_data,
        "alerts": alerts
    }

class ChatRequest(BaseModel):
    message: str
    phase: str  # run_up, bound, back_foot_contact, front_foot_contact, delivery, follow_through, bowling_arm, non_bowling_arm


@app.post("/api/v1/analyze/{job_id}/chat")
async def chat_with_coach(job_id: str, req: ChatRequest):
    """Chat with Coach BowlSmart about a specific phase of the bowling action."""
    if job_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Analysis job not found")

    job = analysis_jobs[job_id]
    if job["status"] != "complete":
        raise HTTPException(status_code=400, detail="Analysis not complete")

    result = job["result"]
    biomechanics = result.get("biomechanics", {})
    bowler_profile = result.get("bowler_profile", {})
    ai_report = result.get("ai_report", {})

    reply = await coach_chat.chat(
        job_id=job_id,
        phase=req.phase,
        user_message=req.message,
        biomechanics=biomechanics,
        bowler_profile=bowler_profile,
        ai_report=ai_report,
    )

    return {"reply": reply, "phase": req.phase}


@app.get("/api/v1/analyze/{job_id}/chat/phases")
async def get_chat_phases(job_id: str):
    """Get available phases for chat with their display names."""
    if job_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Analysis job not found")

    from app.services.coach_chat import PHASE_CONTEXT
    phases = []
    for key, info in PHASE_CONTEXT.items():
        phases.append({
            "id": key,
            "name": info["display_name"],
            "focus_areas": info["focus_areas"],
        })
    return {"phases": phases}


async def run_analysis_pipeline(
    job_id: str, video_path: str, bowler_profile: BowlerProfile, camera_angle: str
):
    """
    Main analysis pipeline — runs as a FastAPI background task.
    All CPU-heavy synchronous steps are offloaded to a thread pool via
    run_in_executor so the event loop stays free to serve status polls.
    """
    job = analysis_jobs[job_id]
    loop = asyncio.get_running_loop()

    def _run(fn, *args):
        """Helper: run a sync callable in the default thread pool."""
        import functools
        return loop.run_in_executor(None, functools.partial(fn, *args))

    try:
        # ── Step 1: Validate & extract frames ────────────────────────────
        job["current_step"] = "Validating video..."
        job["progress"] = 5

        video_processor = VideoProcessor()
        video_info = await _run(video_processor.validate_video, video_path)
        frames = await _run(video_processor.extract_frames, video_path, 10)  # 10fps is enough for phase analysis

        job["progress"] = 15
        job["current_step"] = f"Extracted {len(frames)} frames"

        if len(frames) < 10:
            raise ValueError(
                f"Only {len(frames)} frames extracted. Video may be too short or corrupted."
            )

        # ── Step 2: Pose detection ────────────────────────────────────────
        job["current_step"] = "Running pose detection..."
        job["progress"] = 25

        pose_detector = PoseDetector()
        landmarks_sequence = await _run(pose_detector.detect_poses, frames)
        smoothed_landmarks = await _run(pose_detector.smooth_landmarks, landmarks_sequence)

        valid_count = sum(1 for lm in smoothed_landmarks if lm is not None)
        job["progress"] = 45
        job["current_step"] = f"Detected poses in {valid_count}/{len(frames)} frames"

        if valid_count < 10:
            raise ValueError(
                f"Pose detected in only {valid_count} frames. "
                "Ensure the bowler is clearly visible and well-lit."
            )

        # ── Step 2b: Action validation (Is this actually a bowler?) ────────
        job["current_step"] = "Validating bowling action..."
        await asyncio.sleep(0)
        
        is_bowling = False
        bowl_wrist_name = "right_wrist" if bowler_profile.dominant_arm == "right" else "left_wrist"
        
        for frame in smoothed_landmarks:
            if frame is not None and "landmarks" in frame:
                lms = frame["landmarks"]
                wrist = lms.get(bowl_wrist_name)
                nose = lms.get("nose")
                
                # In MediaPipe, y=0 is top of image, y=1 is bottom
                # If wrist y is less than nose y, arm is above head
                if wrist and nose and wrist["y"] < nose["y"]:
                    is_bowling = True
                    break
        
        if not is_bowling:
            raise ValueError(
                "No bowling action detected. The bowling arm never went above the head. "
                "Please upload a valid cricket fast bowling video."
            )

        # ── Step 3: Phase detection ───────────────────────────────────────
        job["current_step"] = "Detecting bowling phases..."
        job["progress"] = 50

        phase_detector = PhaseDetector()
        phases = await _run(
            phase_detector.detect_phases,
            smoothed_landmarks,
            video_info["fps"],
            bowler_profile.dominant_arm,
        )
        job["progress"] = 60

        # ── Step 4: Biomechanics ──────────────────────────────────────────
        job["current_step"] = "Calculating biomechanics..."
        job["progress"] = 65

        bio_calculator = BiomechanicsCalculator(bowler_profile.dominant_arm)
        biomechanics = await _run(
            bio_calculator.calculate_all,
            smoothed_landmarks,
            phases,
            video_info["fps"],
            bowler_profile.height_cm,
        )
        job["progress"] = 75

        # ── Step 5: Scoring ───────────────────────────────────────────────
        job["current_step"] = "Scoring your action..."
        job["progress"] = 80

        form_scorer = FormScorer()
        phase_scores = await _run(form_scorer.score_phases, biomechanics, phases)
        overall_score = await _run(form_scorer.calculate_overall_score, phase_scores)
        pace_leaks = await _run(form_scorer.identify_pace_leaks, biomechanics, phase_scores)
        max_pace_potential = await _run(form_scorer.estimate_max_pace, biomechanics, bowler_profile)

        injury_scorer = InjuryScorer()
        injury_risk = await _run(injury_scorer.calculate_risk, biomechanics, bowler_profile)

        job["progress"] = 90

        # ── Step 6: AI Report (Gemini judges everything) ──────────────────
        job["current_step"] = "AI is judging your action..."
        print(f"\n[Main] Starting AI Report generation for {job_id}...")
        report_gen = ReportGenerator()
        ai_report = await report_gen.generate_report(
            bowler_profile=bowler_profile.model_dump(),
            biomechanics=biomechanics,
            phase_scores=phase_scores,
            overall_score=overall_score,
            injury_risk=injury_risk,
            pace_leaks=pace_leaks,
            max_pace_potential=max_pace_potential,
        )
        print(f"[Main] AI Report generated. Contains keys: {list(ai_report.keys())}")

        # If AI returned its own scores, use those instead of rule-based
        if "overall_score" in ai_report:
            overall_score = ai_report["overall_score"]
        if "phase_scores" in ai_report:
            phase_scores = ai_report["phase_scores"]
        if "injury_risk" in ai_report:
            injury_risk = ai_report["injury_risk"]
        if "pace_leaks" in ai_report:
            pace_leaks = ai_report["pace_leaks"]
        if "max_pace_potential" in ai_report:
            max_pace_potential = ai_report["max_pace_potential"]

        # ── Step 7: Generate annotated video ─────────────────────────
        job["current_step"] = "Generating annotated video..."
        job["progress"] = 95

        annotator = VideoAnnotator(bowler_profile.dominant_arm)
        annotated_video_path = os.path.join(ANNOTATED_DIR, f"{job_id}.mp4")
        annotation_result = await _run(
            annotator.generate_annotated_video,
            frames, smoothed_landmarks, phases,
            annotated_video_path, 10.0,
        )

        # Build raw_keypoints for frontend comparison player
        raw_keypoints = []
        fps = video_info.get("fps", 10.0)
        for i, lm_data in enumerate(smoothed_landmarks):
            if lm_data and "raw_landmarks" in lm_data:
                raw_keypoints.append({
                    "frame": i,
                    "timestamp_ms": int(i * (1000.0 / fps)),
                    "landmarks": lm_data["raw_landmarks"]
                })
            else:
                raw_keypoints.append({
                    "frame": i,
                    "timestamp_ms": int(i * (1000.0 / fps)),
                    "landmarks": []
                })

        result = {
            "overall_score": overall_score,
            "phase_scores": phase_scores,
            "biomechanics": biomechanics,
            "injury_risk": injury_risk,
            "pace_leaks": pace_leaks,
            "max_pace_potential": max_pace_potential,
            "ai_report": ai_report,
            "video_info": video_info,
            "phases": phases,
            "phase_frames": phases,  # 'phases' contains {run_up: 0, ffc: 12, ...}
            "raw_keypoints": raw_keypoints,
            "bowler_profile": bowler_profile.model_dump(),
            "phase_timestamps": annotation_result.get("phase_timestamps", {}),
            "frame_angles_data": annotation_result.get("frame_data", []),
            "annotated_video_duration": annotation_result.get("duration_sec", 0),
        }

        # Save date inside result for listing
        import datetime
        job["result"] = convert_numpy(result)
        job["result"]["date"] = datetime.datetime.now().strftime("%B %d, %Y")
        
        job["status"] = "complete"
        job["progress"] = 100
        job["current_step"] = "Analysis Complete"
        job["annotated_video_path"] = annotated_video_path
        save_jobs()  # Persist to DB

    except Exception as e:
        import traceback
        traceback.print_exc()
        job["status"] = "failed"
        job["error"] = str(e)
        job["current_step"] = f"Failed: {str(e)}"
        save_jobs()  # Persist to DB
        print(f"Analysis pipeline error for job {job_id}: {e}")

    finally:
        try:
            if os.path.exists(video_path):
                os.remove(video_path)
            upload_dir = os.path.dirname(video_path)
            if os.path.exists(upload_dir) and not os.listdir(upload_dir):
                os.rmdir(upload_dir)
        except Exception:
            pass


class BookPhysioRequest(BaseModel):
    therapist_id: str
    therapist_name: str
    user_name: str
    user_email: str

@app.post("/api/v1/physio/book")
async def book_physiotherapy(req: BookPhysioRequest):
    # Simulate sending an email
    import logging
    logging.info(f"--- MOCK EMAIL SENT ---")
    logging.info(f"To: {req.therapist_id}@bowlsmart-physio.com (Dummy Physio Email)")
    logging.info(f"Subject: New Booking Request from {req.user_name}")
    logging.info(f"Body: User {req.user_name} ({req.user_email}) has requested a Free (Limited Time) video consultation with {req.therapist_name}.")
    logging.info(f"-----------------------")
    
    # Optional: await asyncio.sleep(1) to simulate network delay
    await asyncio.sleep(1)
    
    return {
        "status": "success", 
        "message": f"Booking confirmation sent to {req.therapist_name}."
    }

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
