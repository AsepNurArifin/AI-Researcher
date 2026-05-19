from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: Literal["candidate", "recruiter"]
    created_at: datetime


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=8)
    role: Literal["candidate", "recruiter"]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ResumeParsed(BaseModel):
    skills: List[str]
    education: str
    experience: str
    projects: str
    certifications: str


class ResumeUploadResponse(BaseModel):
    resume_id: str
    file_name: str
    parsed_data: ResumeParsed
    created_at: datetime


class ResumeAnalysisResponse(BaseModel):
    resume_id: str
    file_name: str
    parsed_data: ResumeParsed
    created_at: datetime


class JobCreateRequest(BaseModel):
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)
    skills: Optional[List[str]] = None


class JobOut(BaseModel):
    id: str
    title: str
    description: str
    skills: List[str]
    created_at: datetime


class MatchJobRequest(BaseModel):
    resume_id: str
    job_description: str = Field(min_length=1)
    job_title: Optional[str] = None


class MatchResponse(BaseModel):
    match_percentage: float
    semantic_relevance: float
    matched_skills: List[str]
    missing_skills: List[str]


class CandidateMatch(BaseModel):
    candidate_id: str
    candidate_name: str
    match_percentage: float
    semantic_relevance: float
    missing_skills: List[str]


class JobCandidatesResponse(BaseModel):
    job_id: str
    job_title: str
    candidates: List[CandidateMatch]
