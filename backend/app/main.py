from __future__ import annotations

import logging
import time
from datetime import timedelta
from pathlib import Path
from typing import Dict

from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile, status

from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .core.database import Base, engine, get_db
from .core.rate_limiter import RateLimiter
from .services.ml import EmbeddingService
from .core.security import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ALGORITHM,
    SECRET_KEY,
    create_access_token,
    get_password_hash,
    verify_password,
)
from .schemas import (
    AuthResponse,
    CandidateMatch,
    JobCandidatesResponse,
    JobCreateRequest,
    JobOut,
    LoginRequest,
    MatchJobRequest,
    MatchResponse,
    RegisterRequest,
    ResumeAnalysisResponse,
    ResumeParsed,
    ResumeUploadResponse,
    UserOut,
)
from .services.matching import compute_match, extract_job_skills
from .services.parsing import extract_sections, extract_skills, extract_text, sanitize_filename
from .storage import DatabaseStore

logger = logging.getLogger("hiresense")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

if SECRET_KEY == "dev-secret-change-me":
    logger.warning("HIRESENSE_SECRET_KEY is not set; using a development secret.")

rate_limiter = RateLimiter(limit=60, window_seconds=60)

tags_metadata = [
    {
        "name": "Auth",
        "description": "Registration and login for candidates and recruiters.",
    },
    {
        "name": "Resumes",
        "description": "Resume upload and analysis endpoints.",
    },
    {
        "name": "Matches",
        "description": "Match a resume against a job description.",
    },
    {
        "name": "Jobs",
        "description": "Recruiter job creation and candidate ranking.",
    },
]

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="HireSense AI API",
    description=(
        "MVP API for resume ↔ job matching with authentication, "
        "resume parsing, and recruiter ranking."
    ),
    version="0.1.0",
    openapi_tags=tags_metadata,
    dependencies=[Depends(rate_limiter)],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


auth_scheme = HTTPBearer()


def get_store(db: Session = Depends(get_db)) -> DatabaseStore:
    return DatabaseStore(db)


ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024


@app.middleware("http")
async def log_requests(request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start_time) * 1000
    logger.info(
        "%s %s %s %.2fms",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(auth_scheme),
    store: DatabaseStore = Depends(get_store),
) -> Dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        )

    user = store.get_user(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )
    return user


def require_role(role: str):
    def dependency(user: Dict = Depends(get_current_user)) -> Dict:
        if user["role"] != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this resource.",
            )
        return user

    return dependency


@app.post(
    "/register",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    tags=["Auth"],
    summary="Register a new user",
    description="Create a candidate or recruiter account.",
)
def register(payload: RegisterRequest, store: DatabaseStore = Depends(get_store)):
    if store.get_user_by_email(payload.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered.",
        )

    user = store.create_user(
        name=payload.name,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        role=payload.role,
    )
    return UserOut(**user)


@app.post(
    "/login",
    response_model=AuthResponse,
    tags=["Auth"],
    summary="Login and receive JWT",
    description="Authenticate a user and return a JWT access token.",
)
def login(payload: LoginRequest, store: DatabaseStore = Depends(get_store)):
    user = store.get_user_by_email(payload.email)
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    access_token = create_access_token(
        {"sub": user["id"], "role": user["role"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return AuthResponse(access_token=access_token, user=UserOut(**user))


@app.post(
    "/upload-resume",
    response_model=ResumeUploadResponse,
    tags=["Resumes"],
    summary="Upload a resume",
    description="Upload a PDF/DOCX resume, parse it, and return extracted data.",
)
async def upload_resume(
    file: UploadFile = File(...),
    user: Dict = Depends(require_role("candidate")),
    store: DatabaseStore = Depends(get_store),
):
    file_name = sanitize_filename(file.filename or "resume_upload")
    extension = Path(file_name).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF or DOCX files are supported.",
        )

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds the 5MB limit.",
        )

    parsed_text = extract_text(file_bytes)
    parsed_sections = extract_sections(parsed_text)
    parsed_data = ResumeParsed(
        skills=extract_skills(parsed_text),
        education=parsed_sections["education"],
        experience=parsed_sections["experience"],
        projects=parsed_sections["projects"],
        certifications=parsed_sections["certifications"],
    )

    embedding = EmbeddingService.get_embedding(parsed_text)

    resume = store.create_resume(
        user_id=user["id"],
        file_name=file_name,
        parsed_text=parsed_text,
        parsed_data=parsed_data.model_dump(),
        embedding=embedding,
    )

    logger.info("Resume upload user=%s file=%s size=%d", user["id"], file_name, len(file_bytes))
    return ResumeUploadResponse(
        resume_id=resume["id"],
        file_name=resume["file_name"],
        parsed_data=parsed_data,
        created_at=resume["created_at"],
    )


@app.get(
    "/resume-analysis/{resume_id}",
    response_model=ResumeAnalysisResponse,
    tags=["Resumes"],
    summary="Get resume analysis",
    description="Fetch parsed resume data for the authenticated candidate.",
)
def resume_analysis(
    resume_id: str,
    user: Dict = Depends(require_role("candidate")),
    store: DatabaseStore = Depends(get_store),
):
    resume = store.get_resume(resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    if resume["user_id"] != user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this resume.",
        )

    return ResumeAnalysisResponse(
        resume_id=resume["id"],
        file_name=resume["file_name"],
        parsed_data=ResumeParsed(**resume["parsed_data"]),
        created_at=resume["created_at"],
    )


def run_match(resume_id: str, job_description: str, store: DatabaseStore) -> MatchResponse:
    resume = store.get_resume(resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    job_skills = extract_job_skills(job_description)
    job_embedding = EmbeddingService.get_embedding(job_description)
    
    matched, missing, match_percentage, semantic_relevance = compute_match(
        resume["parsed_data"]["skills"],
        job_skills,
        resume_embedding=resume.get("embedding"),
        job_embedding=job_embedding,
    )
    return MatchResponse(
        match_percentage=match_percentage,
        semantic_relevance=semantic_relevance,
        matched_skills=matched,
        missing_skills=missing,
    )


@app.post(
    "/match-job",
    response_model=MatchResponse,
    tags=["Matches"],
    summary="Match resume to job description",
    description="Compute match percentage, semantic relevance, and missing skills.",
)
def match_job(
    payload: MatchJobRequest,
    user: Dict = Depends(require_role("candidate")),
    store: DatabaseStore = Depends(get_store),
):
    resume = store.get_resume(payload.resume_id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    if resume["user_id"] != user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this resume.",
        )

    result = run_match(payload.resume_id, payload.job_description, store)
    logger.info("Match computed user=%s resume=%s score=%.1f", user["id"], payload.resume_id, result.match_percentage)
    return result


@app.post(
    "/match",
    response_model=MatchResponse,
    tags=["Matches"],
    summary="Match resume to job description (alias)",
    description="Alias of /match-job for compatibility with the PRD.",
)
def match(
    payload: MatchJobRequest,
    user: Dict = Depends(require_role("candidate")),
    store: DatabaseStore = Depends(get_store),
):
    return match_job(payload, user, store)


@app.post(
    "/jobs",
    response_model=JobOut,
    status_code=status.HTTP_201_CREATED,
    tags=["Jobs"],
    summary="Create a job posting",
    description="Recruiters create a job posting for matching.",
)
def create_job(
    payload: JobCreateRequest,
    user: Dict = Depends(require_role("recruiter")),
    store: DatabaseStore = Depends(get_store),
):
    skills = extract_job_skills(payload.description, payload.skills)
    embedding = EmbeddingService.get_embedding(payload.description)
    job = store.create_job(
        recruiter_id=user["id"],
        title=payload.title,
        description=payload.description,
        skills=skills,
        embedding=embedding,
    )
    logger.info("Job created recruiter=%s job=%s", user["id"], job["id"])
    return JobOut(**job)


@app.get(
    "/jobs/{job_id}/candidates",
    response_model=JobCandidatesResponse,
    tags=["Jobs"],
    summary="Rank candidates for a job",
    description="Return candidate rankings based on skill match.",
)
def job_candidates(
    job_id: str,
    user: Dict = Depends(require_role("recruiter")),
    store: DatabaseStore = Depends(get_store),
):
    job = store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    if job["recruiter_id"] != user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this job.",
        )

    candidates: list[CandidateMatch] = []
    for resume in store.list_resumes():
        resume_user = store.get_user(resume["user_id"])
        if not resume_user or resume_user["role"] != "candidate":
            continue

        matched, missing, match_percentage, semantic_relevance = compute_match(
            resume["parsed_data"]["skills"],
            job["skills"],
            resume_embedding=resume.get("embedding"),
            job_embedding=job.get("embedding"),
        )
        candidates.append(
            CandidateMatch(
                candidate_id=resume_user["id"],
                candidate_name=resume_user["name"],
                match_percentage=match_percentage,
                semantic_relevance=semantic_relevance,
                missing_skills=missing,
            )
        )

    candidates.sort(key=lambda item: item.match_percentage, reverse=True)
    logger.info("Candidates ranked recruiter=%s job=%s count=%d", user["id"], job_id, len(candidates))
    return JobCandidatesResponse(job_id=job["id"], job_title=job["title"], candidates=candidates)

