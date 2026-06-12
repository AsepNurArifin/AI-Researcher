from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, EmailStr, Field


class UserOut(BaseModel):
    id: str = Field(..., description="Unique user identifier (UUID)", json_schema_extra={"example": "d1a8e1b2-1324-4fcd-8fa5-5cb95d8291a2"})
    name: str = Field(..., description="Full name of the user", json_schema_extra={"example": "Alice Developer"})
    email: EmailStr = Field(..., description="Email address of the user", json_schema_extra={"example": "alice.dev@example.com"})
    role: Literal["candidate", "recruiter"] = Field(..., description="Role of the user in the platform", json_schema_extra={"example": "candidate"})
    company_id: Optional[str] = Field(None, description="Company identifier (only for recruiters)", json_schema_extra={"example": "ac78b61c-843d-4c3e-862a-7140e4fcd9aa"})
    created_at: datetime = Field(..., description="Timestamp when the user account was created")


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, description="Full name of the user", json_schema_extra={"example": "Alice Developer"})
    email: EmailStr = Field(..., description="Valid email address to register", json_schema_extra={"example": "alice.dev@example.com"})
    password: str = Field(..., min_length=8, description="Secure password (minimum 8 characters)", json_schema_extra={"example": "password123"})
    role: Literal["candidate", "recruiter"] = Field(..., description="Sign up as a candidate or a recruiter", json_schema_extra={"example": "candidate"})
    company_name: Optional[str] = Field(None, description="Company name (required if role is recruiter)", json_schema_extra={"example": "Acme Corporation"})


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered email address", json_schema_extra={"example": "alice.dev@example.com"})
    password: str = Field(..., description="User password", json_schema_extra={"example": "password123"})


class AuthResponse(BaseModel):
    access_token: str = Field(..., description="JWT access token for authorization", json_schema_extra={"example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."})
    token_type: str = Field("bearer", description="Token authentication type", json_schema_extra={"example": "bearer"})
    user: UserOut = Field(..., description="Details of the authenticated user")


class ResumeParsed(BaseModel):
    skills: List[str] = Field(..., description="List of extracted skills from the resume", json_schema_extra={"example": ["Python", "FastAPI", "Docker", "Git"]})
    education: str = Field(..., description="Extracted education details", json_schema_extra={"example": "BS in Computer Science, XYZ University"})
    experience: str = Field(..., description="Extracted work experience", json_schema_extra={"example": "Backend Engineer at TechCorp (2 years)"})
    projects: str = Field(..., description="Extracted personal or professional projects", json_schema_extra={"example": "Built a REST API with FastAPI"})
    certifications: str = Field(..., description="Extracted certifications", json_schema_extra={"example": "AWS Certified Cloud Practitioner"})


class ResumeUploadResponse(BaseModel):
    resume_id: str = Field(..., description="Unique resume identifier (UUID)", json_schema_extra={"example": "b1a2e3b4-5678-4fcd-8fa5-5cb95d8291a2"})
    file_name: str = Field(..., description="Sanitized file name of the uploaded resume", json_schema_extra={"example": "alice_dev_resume.pdf"})
    parsed_data: ResumeParsed = Field(..., description="Structured parsed data extracted from the resume file")
    created_at: datetime = Field(..., description="Timestamp when the resume was uploaded")


class ResumeAnalysisResponse(BaseModel):
    resume_id: str = Field(..., description="Unique resume identifier (UUID)", json_schema_extra={"example": "b1a2e3b4-5678-4fcd-8fa5-5cb95d8291a2"})
    file_name: str = Field(..., description="File name of the resume", json_schema_extra={"example": "alice_dev_resume.pdf"})
    parsed_data: ResumeParsed = Field(..., description="Parsed resume information")
    created_at: datetime = Field(..., description="Timestamp when the resume was uploaded")


class JobCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, description="Job title", json_schema_extra={"example": "Python Backend Developer"})
    description: str = Field(..., min_length=1, description="Detailed job description", json_schema_extra={"example": "Looking for a Python Backend Developer with FastAPI experience to build REST APIs."})
    skills: Optional[List[str]] = Field(None, description="Optional custom skills list to override automatic extraction", json_schema_extra={"example": ["Python", "FastAPI", "SQL"]})


class JobOut(BaseModel):
    id: str = Field(..., description="Unique job identifier (UUID)", json_schema_extra={"example": "j1a2e3b4-5678-4fcd-8fa5-5cb95d8291a2"})
    title: str = Field(..., description="Job title", json_schema_extra={"example": "Python Backend Developer"})
    description: str = Field(..., description="Detailed job description", json_schema_extra={"example": "Looking for a Python Backend Developer with FastAPI experience..."})
    skills: List[str] = Field(..., description="Extracted or defined skills for this job", json_schema_extra={"example": ["Python", "FastAPI", "SQL"]})
    created_at: datetime = Field(..., description="Timestamp when the job description was created")


class MatchJobRequest(BaseModel):
    resume_id: str = Field(..., description="ID of the resume to evaluate", json_schema_extra={"example": "b1a2e3b4-5678-4fcd-8fa5-5cb95d8291a2"})
    job_description: str = Field(..., min_length=1, description="Full description of the job to match against", json_schema_extra={"example": "Requirements: Python, SQL, REST APIs, Git."})
    job_title: Optional[str] = Field(None, description="Optional job title for labeling match history", json_schema_extra={"example": "Python Developer"})


class MatchResponse(BaseModel):
    match_percentage: float = Field(..., description="Calculated matching score (0 to 100)", json_schema_extra={"example": 85.5})
    semantic_relevance: float = Field(..., description="Cosine similarity based semantic relevance (0 to 1)", json_schema_extra={"example": 0.88})
    matched_skills: List[str] = Field(..., description="Skills present in both resume and job requirements", json_schema_extra={"example": ["Python", "Git"]})
    missing_skills: List[str] = Field(..., description="Job requirements missing from the resume", json_schema_extra={"example": ["SQL"]})


class CandidateMatch(BaseModel):
    candidate_id: str = Field(..., description="Candidate user identifier (UUID)", json_schema_extra={"example": "d1a8e1b2-1324-4fcd-8fa5-5cb95d8291a2"})
    candidate_name: str = Field(..., description="Full name of the candidate", json_schema_extra={"example": "Alice Developer"})
    match_percentage: float = Field(..., description="Match percentage score", json_schema_extra={"example": 85.5})
    semantic_relevance: float = Field(..., description="Semantic score", json_schema_extra={"example": 0.88})
    missing_skills: List[str] = Field(..., description="Skills missing in candidate resume", json_schema_extra={"example": ["SQL"]})


class JobCandidatesResponse(BaseModel):
    job_id: str = Field(..., description="Unique job identifier (UUID)", json_schema_extra={"example": "j1a2e3b4-5678-4fcd-8fa5-5cb95d8291a2"})
    job_title: str = Field(..., description="Job title", json_schema_extra={"example": "Python Backend Developer"})
    candidates: List[CandidateMatch] = Field(..., description="Ranked list of candidate match results")


class ResumeListItem(BaseModel):
    resume_id: str = Field(..., description="Resume identifier", json_schema_extra={"example": "b1a2e3b4-5678-4fcd-8fa5-5cb95d8291a2"})
    file_name: str = Field(..., description="Filename", json_schema_extra={"example": "resume.pdf"})
    parsed_data: ResumeParsed = Field(..., description="Parsed resume details")
    created_at: datetime = Field(..., description="Upload timestamp")


class MatchHistoryItem(BaseModel):
    match_id: str = Field(..., description="Unique match identifier", json_schema_extra={"example": "m1a2e3b4-5678-4fcd-8fa5-5cb95d8291a2"})
    resume_id: str = Field(..., description="Resume identifier", json_schema_extra={"example": "b1a2e3b4-5678-4fcd-8fa5-5cb95d8291a2"})
    score: float = Field(..., description="Matching score", json_schema_extra={"example": 85.5})
    semantic_relevance: float = Field(..., description="Semantic score", json_schema_extra={"example": 0.88})
    matched_skills: List[str] = Field(..., description="List of matched skills", json_schema_extra={"example": ["Python"]})
    missing_skills: List[str] = Field(..., description="List of missing skills", json_schema_extra={"example": ["SQL"]})
    job_title: Optional[str] = Field(None, description="Job title matched against", json_schema_extra={"example": "Python Developer"})
    job_description_snippet: Optional[str] = Field(None, description="Snippet of the matched job description", json_schema_extra={"example": "Looking for a Python Backend Developer..."})
    created_at: datetime = Field(..., description="Timestamp when match was computed")


class WeakPhrase(BaseModel):
    phrase: str = Field(..., description="Weak or passive phrase detected in the resume", json_schema_extra={"example": "responsible for"})
    suggestion: str = Field(..., description="Active, action-oriented replacement phrase", json_schema_extra={"example": "led or coordinated"})


class ResumeFeedback(BaseModel):
    weak_phrases: List[WeakPhrase] = Field(..., description="List of weak phrases and suggestions for improvement")
    missing_keywords: List[str] = Field(..., description="Important keywords missing from the resume based on the job", json_schema_extra={"example": ["Docker", "Kubernetes"]})
    ats_recommendations: List[str] = Field(..., description="General recommendations to improve ATS compliance")


class MatchWithFeedbackResponse(BaseModel):
    match_percentage: float = Field(..., description="Match percentage", json_schema_extra={"example": 85.5})
    semantic_relevance: float = Field(..., description="Semantic score", json_schema_extra={"example": 0.88})
    matched_skills: List[str] = Field(..., description="Skills found in resume", json_schema_extra={"example": ["Python"]})
    missing_skills: List[str] = Field(..., description="Required skills missing from resume", json_schema_extra={"example": ["SQL"]})
    feedback: ResumeFeedback = Field(..., description="ATS feedback for improvement")


class PaginatedJobsResponse(BaseModel):
    items: List[JobOut] = Field(..., description="List of jobs in this page")
    total_count: int = Field(..., description="Total number of jobs matching the query", json_schema_extra={"example": 25})


class PaginatedResumesResponse(BaseModel):
    items: List[ResumeListItem] = Field(..., description="List of resumes in this page")
    total_count: int = Field(..., description="Total number of resumes uploaded by user", json_schema_extra={"example": 3})


class PaginatedMatchesResponse(BaseModel):
    items: List[MatchHistoryItem] = Field(..., description="List of match history items in this page")
    total_count: int = Field(..., description="Total number of match history entries", json_schema_extra={"example": 10})
