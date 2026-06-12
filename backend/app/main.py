from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager
from datetime import timedelta
from pathlib import Path
from typing import Dict, List

from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import text
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
    MatchHistoryItem,
    MatchJobRequest,
    MatchResponse,
    MatchWithFeedbackResponse,
    RegisterRequest,
    ResumeAnalysisResponse,
    ResumeListItem,
    ResumeParsed,
    ResumeUploadResponse,
    UserOut,
    PaginatedJobsResponse,
    PaginatedResumesResponse,
    PaginatedMatchesResponse,
)
from .services.feedback import generate_feedback
from .services.matching import compute_match, extract_job_skills
from .services.parsing import extract_sections, extract_skills, extract_text, sanitize_filename, detect_file_type
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables synced successfully.")
    except Exception as e:
        logger.error("Database connection failed: %s", e)
        logger.error("Backend will start but DB-dependent endpoints will fail. Check your .env DATABASE_URL and Supabase IP allowlist.")

    try:
        logger.info("Pre-loading Embedding Service model...")
        EmbeddingService.get_model()
        logger.info("Embedding Service model loaded successfully.")
    except Exception as e:
        logger.warning("Embedding model not loaded: %s. Semantic matching will use fallback zero vectors.", e)

    yield

app = FastAPI(
    title="HireSense AI API",
    description=(
        "MVP API for resume ↔ job matching with authentication, "
        "resume parsing, and recruiter ranking."
    ),
    version="0.1.0",
    openapi_tags=tags_metadata,
    dependencies=[Depends(rate_limiter)],
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from .core.exceptions import BaseAppException

@app.exception_handler(BaseAppException)
async def app_exception_handler(request: Request, exc: BaseAppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": exc.code},
    )

from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(StarletteHTTPException)
async def fastapi_http_exception_handler(request: Request, exc: StarletteHTTPException):
    code = "HTTP_ERROR"
    if exc.status_code == 404:
        code = "NOT_FOUND"
    elif exc.status_code == 403:
        code = "FORBIDDEN"
    elif exc.status_code == 401:
        code = "UNAUTHORIZED"
    elif exc.status_code == 400:
        code = "BAD_REQUEST"
    elif exc.status_code == 409:
        code = "CONFLICT"
    elif exc.status_code == 422:
        code = "VALIDATION_ERROR"
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": code},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": exc.errors(),
            "code": "VALIDATION_ERROR"
        },
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred.",
            "code": "INTERNAL_SERVER_ERROR"
        },
    )



def get_store(db: Session = Depends(get_db)) -> DatabaseStore:
    return DatabaseStore(db)


auth_scheme = HTTPBearer()


@app.get("/health", tags=["Health"], summary="Health check", description="Check if the backend is running and DB is connected.")
def healthcheck(store: DatabaseStore = Depends(get_store)):
    db_status = "unknown"
    try:
        store.db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"disconnected: {e}"

    return {
        "status": "ok",
        "database": db_status,
        "version": "0.1.0",
    }


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
    user.pop("password_hash", None)

    # Self-healing for legacy recruiters without company_id
    if user.get("role") == "recruiter" and not user.get("company_id"):
        company = store.create_company(f"{user['name']}'s Company")
        store.db.execute(
            text("UPDATE users SET company_id = :comp_id WHERE id = :user_id"),
            {"comp_id": company["id"], "user_id": user["id"]}
        )
        store.db.commit()
        user["company_id"] = company["id"]

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


def require_any_role(*roles: str):
    def dependency(user: Dict = Depends(get_current_user)) -> Dict:
        if user["role"] not in roles:
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

    company_id = None
    if payload.role == "recruiter":
        if not payload.company_name or not payload.company_name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company name is required for recruiter registration.",
            )
        comp_name = payload.company_name.strip()
        company = store.get_company_by_name(comp_name)
        if not company:
            company = store.create_company(comp_name)
        company_id = company["id"]

    user = store.create_user(
        name=payload.name,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        role=payload.role,
        company_id=company_id,
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

    if not file.content_type or file.content_type not in ALLOWED_MIME_TYPES:
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

    # Validasi magic bytes (magic number) untuk keamanan file upload
    detected_type = detect_file_type(file_bytes)
    if not detected_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file content. The file headers do not match a valid PDF or DOCX file.",
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


def run_match(resume: Dict, job_description: str, store: DatabaseStore) -> MatchResponse:

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
    response_model=MatchWithFeedbackResponse,
    tags=["Matches"],
    summary="Match resume to job description",
    description="Compute match percentage, semantic relevance, missing skills, and resume feedback.",
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

    result = run_match(resume, payload.job_description, store)

    # Generate dynamic resume feedback
    job_skills = extract_job_skills(payload.job_description)
    feedback = generate_feedback(
        resume_text=resume["parsed_text"],
        resume_skills=resume["parsed_data"]["skills"],
        job_skills=job_skills,
        matched_skills=result.matched_skills,
        missing_skills=result.missing_skills,
        match_percentage=result.match_percentage,
    )

    # Persist the match result
    store.create_match(
        resume_id=payload.resume_id,
        job_id=None,
        score=result.match_percentage,
        missing_skills=result.missing_skills,
        matched_skills=result.matched_skills,
        semantic_relevance=result.semantic_relevance,
        job_title=payload.job_title,
        job_description=payload.job_description,
    )

    logger.info("Match computed user=%s resume=%s score=%.1f", user["id"], payload.resume_id, result.match_percentage)
    return MatchWithFeedbackResponse(
        match_percentage=result.match_percentage,
        semantic_relevance=result.semantic_relevance,
        matched_skills=result.matched_skills,
        missing_skills=result.missing_skills,
        feedback=feedback,
    )


@app.post(
    "/match",
    response_model=MatchWithFeedbackResponse,
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
    if not user.get("company_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recruiter is not associated with any company."
        )
    skills = extract_job_skills(payload.description, payload.skills)
    embedding = EmbeddingService.get_embedding(payload.description)
    job = store.create_job(
        recruiter_id=user["id"],
        company_id=user["company_id"],
        title=payload.title,
        description=payload.description,
        skills=skills,
        embedding=embedding,
    )
    logger.info("Job created recruiter=%s company=%s job=%s", user["id"], user["company_id"], job["id"])
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

    if job["company_id"] != user.get("company_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this job.",
        )
    candidates: list[CandidateMatch] = []
    job_emb = job.get("embedding")
    
    if job_emb:
        ranked_resumes = store.get_ranked_candidates(job_emb, limit=50)
    else:
        # Fallback to listing all resumes if embedding is missing
        ranked_resumes = []
        for r in store.list_resumes():
            resume_user = store.get_user(r["user_id"])
            if resume_user and resume_user["role"] == "candidate":
                r["candidate_name"] = resume_user["name"]
                ranked_resumes.append(r)

    for resume in ranked_resumes:
        matched, missing, match_percentage, semantic_relevance = compute_match(
            resume["parsed_data"]["skills"],
            job["skills"],
            resume_embedding=resume.get("embedding"),
            job_embedding=job_emb,
        )
        candidates.append(
            CandidateMatch(
                candidate_id=resume["user_id"],
                candidate_name=resume.get("candidate_name", "Unknown Candidate"),
                match_percentage=match_percentage,
                semantic_relevance=semantic_relevance,
                missing_skills=missing,
            )
        )

    candidates.sort(key=lambda item: item.match_percentage, reverse=True)
    logger.info("Candidates ranked recruiter=%s job=%s count=%d", user["id"], job_id, len(candidates))
    return JobCandidatesResponse(job_id=job["id"], job_title=job["title"], candidates=candidates)


# ── Missing endpoints required by PRD ──────────────────────────────


@app.get(
    "/jobs",
    response_model=PaginatedJobsResponse,
    tags=["Jobs"],
    summary="List jobs",
    description="If candidate, return all jobs globally. If recruiter, return recruiter's company's jobs.",
)
def list_jobs(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: Dict = Depends(require_any_role("candidate", "recruiter")),
    store: DatabaseStore = Depends(get_store),
):
    if user["role"] == "recruiter":
        if not user.get("company_id"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Recruiter is not associated with any company."
            )
        jobs, total_count = store.list_jobs_by_company(user["company_id"], limit=limit, offset=offset)
    else:
        jobs, total_count = store.list_all_jobs(limit=limit, offset=offset)
        
    return PaginatedJobsResponse(
        items=[JobOut(**j) for j in jobs],
        total_count=total_count
    )


@app.delete(
    "/resumes/{resume_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Resumes"],
    summary="Delete a resume",
    description="Delete a resume and all associated matches/applications.",
)
def delete_resume(
    resume_id: str,
    user: Dict = Depends(require_role("candidate")),
    store: DatabaseStore = Depends(get_store),
):
    deleted = store.delete_resume(resume_id, user["id"])
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or you do not have permission to delete it.",
        )
    return


@app.put(
    "/jobs/{job_id}",
    response_model=JobOut,
    tags=["Jobs"],
    summary="Update a job posting",
    description="Update a job posting, re-extract skills and update the description embedding.",
)
def update_job(
    job_id: str,
    payload: JobCreateRequest,
    user: Dict = Depends(require_role("recruiter")),
    store: DatabaseStore = Depends(get_store),
):
    if not user.get("company_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recruiter is not associated with any company."
        )
    
    job = store.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found."
        )
    if job["company_id"] != user["company_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to update this job."
        )

    skills = extract_job_skills(payload.description, payload.skills)
    embedding = EmbeddingService.get_embedding(payload.description)
    
    updated_job = store.update_job(
        job_id=job_id,
        company_id=user["company_id"],
        title=payload.title,
        description=payload.description,
        skills=skills,
        embedding=embedding,
    )
    if not updated_job:
         raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job update failed."
        )
    return JobOut(**updated_job)


@app.post(
    "/jobs/{job_id}/apply",
    status_code=status.HTTP_201_CREATED,
    tags=["Jobs"],
    summary="Apply for a job",
    description="Candidate applies for a job with their latest resume. Links matches automatically.",
)
def apply_job(
    job_id: str,
    user: Dict = Depends(require_role("candidate")),
    store: DatabaseStore = Depends(get_store),
):
    resumes, count = store.list_resumes_by_user(user["id"], limit=1, offset=0)
    if not resumes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must upload a resume before applying to a job.",
        )
    latest_resume = resumes[0]

    job = store.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found."
        )

    existing_app = store.get_application(job_id, latest_resume["id"])
    if existing_app:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already applied to this job with your current resume.",
        )

    app_data = store.create_application(job_id, latest_resume["id"])

    # Compute and persist match so recruiter ranking has actual application matching data
    job_skills = job["skills"]
    job_emb = job.get("embedding")
    
    matched, missing, match_percentage, semantic_relevance = compute_match(
        latest_resume["parsed_data"]["skills"],
        job_skills,
        resume_embedding=latest_resume.get("embedding"),
        job_embedding=job_emb,
    )

    store.create_match(
        resume_id=latest_resume["id"],
        job_id=job_id,
        score=match_percentage,
        missing_skills=missing,
        matched_skills=matched,
        semantic_relevance=semantic_relevance,
        job_title=job["title"],
        job_description=job["description"],
    )

    return {"status": "success", "application_id": app_data["id"]}


@app.get(
    "/jobs/{job_id}/applied",
    tags=["Jobs"],
    summary="Check application status",
    description="Check if the candidate has applied to a specific job.",
)
def check_applied(
    job_id: str,
    user: Dict = Depends(require_role("candidate")),
    store: DatabaseStore = Depends(get_store),
):
    resumes, count = store.list_resumes_by_user(user["id"], limit=100, offset=0)
    if not resumes:
        return {"applied": False}
    
    for r in resumes:
        existing_app = store.get_application(job_id, r["id"])
        if existing_app:
            return {"applied": True, "applied_at": existing_app["applied_at"]}
            
    return {"applied": False}


@app.get(
    "/resumes",
    response_model=PaginatedResumesResponse,
    tags=["Resumes"],
    summary="List candidate's resumes",
    description="Return all resumes uploaded by the authenticated candidate.",
)
def list_resumes(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: Dict = Depends(require_role("candidate")),
    store: DatabaseStore = Depends(get_store),
):
    resumes, total_count = store.list_resumes_by_user(user["id"], limit=limit, offset=offset)
    return PaginatedResumesResponse(
        items=[
            ResumeListItem(
                resume_id=r["id"],
                file_name=r["file_name"],
                parsed_data=ResumeParsed(**r["parsed_data"]),
                created_at=r["created_at"],
            )
            for r in resumes
        ],
        total_count=total_count
    )


@app.get(
    "/matches",
    response_model=PaginatedMatchesResponse,
    tags=["Matches"],
    summary="List candidate's match history",
    description="Return all past match results for the authenticated candidate.",
)
def list_matches(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: Dict = Depends(require_role("candidate")),
    store: DatabaseStore = Depends(get_store),
):
    matches, total_count = store.list_matches_by_user(user["id"], limit=limit, offset=offset)
    items: list[MatchHistoryItem] = []
    for m in matches:
        data = m["missing_skills"]  # enriched JSON blob
        if data is None:
            items.append(MatchHistoryItem(
                match_id=m["id"],
                resume_id=m["resume_id"],
                score=m["score"],
                semantic_relevance=0.0,
                matched_skills=[],
                missing_skills=[],
                created_at=m["created_at"],
            ))
        elif isinstance(data, dict):
            items.append(MatchHistoryItem(
                match_id=m["id"],
                resume_id=m["resume_id"],
                score=m["score"],
                semantic_relevance=data.get("semantic_relevance", 0.0),
                matched_skills=data.get("matched_skills", []),
                missing_skills=data.get("missing_skills", []),
                job_title=data.get("job_title"),
                job_description_snippet=data.get("job_description_snippet"),
                created_at=m["created_at"],
            ))
        else:
            # Legacy rows where missing_skills was a plain list
            items.append(MatchHistoryItem(
                match_id=m["id"],
                resume_id=m["resume_id"],
                score=m["score"],
                semantic_relevance=0.0,
                matched_skills=[],
                missing_skills=data if isinstance(data, list) else [],
                created_at=m["created_at"],
            ))
    return PaginatedMatchesResponse(
        items=items,
        total_count=total_count
    )
