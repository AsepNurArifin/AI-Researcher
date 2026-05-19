from __future__ import annotations

import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, JSON, String, Text
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

from .core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "candidate" or "recruiter"
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="recruiter", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String, nullable=False)
    parsed_text = Column(Text, nullable=False)
    parsed_data = Column(JSON, nullable=False)  # JSON representation of ResumeParsed
    embedding = Column(Vector(384), nullable=True)  # nullable until STEP 5 (sentence-transformers)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="resumes")
    matches = relationship("Match", back_populates="resume", cascade="all, delete-orphan")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True, index=True)
    recruiter_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    skills = Column(JSON, nullable=False)  # List of skills
    embedding = Column(Vector(384), nullable=True)  # nullable until STEP 5 (sentence-transformers)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    recruiter = relationship("User", back_populates="jobs")
    matches = relationship("Match", back_populates="job", cascade="all, delete-orphan")


class Match(Base):
    __tablename__ = "matches"

    id = Column(String(36), primary_key=True, index=True)
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, nullable=False)
    missing_skills = Column(JSON, nullable=False)  # List of missing skills
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    resume = relationship("Resume", back_populates="matches")
    job = relationship("Job", back_populates="matches")
