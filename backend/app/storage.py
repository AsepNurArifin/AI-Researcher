from __future__ import annotations

import datetime
from typing import Dict, List, Optional
from uuid import uuid4
from sqlalchemy.orm import Session

from .models import User, Resume, Job, Match


class DatabaseStore:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _user_to_dict(self, user: User | None) -> Dict | None:
        if not user:
            return None
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "password_hash": user.password_hash,
            "role": user.role,
            "created_at": user.created_at,
        }

    def _resume_to_dict(self, resume: Resume | None) -> Dict | None:
        if not resume:
            return None
        return {
            "id": resume.id,
            "user_id": resume.user_id,
            "file_name": resume.file_name,
            "parsed_text": resume.parsed_text,
            "parsed_data": resume.parsed_data,
            "embedding": list(resume.embedding) if resume.embedding is not None else None,
            "created_at": resume.created_at,
        }

    def _job_to_dict(self, job: Job | None) -> Dict | None:
        if not job:
            return None
        return {
            "id": job.id,
            "recruiter_id": job.recruiter_id,
            "title": job.title,
            "description": job.description,
            "skills": job.skills,
            "embedding": list(job.embedding) if job.embedding is not None else None,
            "created_at": job.created_at,
        }

    def create_user(self, name: str, email: str, password_hash: str, role: str) -> Dict:
        user_id = uuid4().hex
        db_user = User(
            id=user_id,
            name=name,
            email=email,
            password_hash=password_hash,
            role=role,
            created_at=datetime.datetime.utcnow(),
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return self._user_to_dict(db_user)

    def get_user_by_email(self, email: str) -> Optional[Dict]:
        db_user = self.db.query(User).filter(User.email == email).first()
        return self._user_to_dict(db_user)

    def get_user(self, user_id: str) -> Optional[Dict]:
        db_user = self.db.query(User).filter(User.id == user_id).first()
        return self._user_to_dict(db_user)

    def create_resume(
        self,
        user_id: str,
        file_name: str,
        parsed_text: str,
        parsed_data: Dict,
        embedding: Optional[List[float]] = None,
    ) -> Dict:
        resume_id = uuid4().hex
        db_resume = Resume(
            id=resume_id,
            user_id=user_id,
            file_name=file_name,
            parsed_text=parsed_text,
            parsed_data=parsed_data,
            embedding=embedding,
            created_at=datetime.datetime.utcnow(),
        )
        self.db.add(db_resume)
        self.db.commit()
        self.db.refresh(db_resume)
        return self._resume_to_dict(db_resume)

    def get_resume(self, resume_id: str) -> Optional[Dict]:
        db_resume = self.db.query(Resume).filter(Resume.id == resume_id).first()
        return self._resume_to_dict(db_resume)

    def list_resumes(self) -> List[Dict]:
        resumes = self.db.query(Resume).all()
        return [self._resume_to_dict(r) for r in resumes if r is not None]

    def list_resumes_by_user(self, user_id: str) -> List[Dict]:
        resumes = self.db.query(Resume).filter(Resume.user_id == user_id).all()
        return [self._resume_to_dict(r) for r in resumes if r is not None]

    def create_job(
        self,
        recruiter_id: str,
        title: str,
        description: str,
        skills: List[str],
        embedding: Optional[List[float]] = None,
    ) -> Dict:
        job_id = uuid4().hex
        db_job = Job(
            id=job_id,
            recruiter_id=recruiter_id,
            title=title,
            description=description,
            skills=skills,
            embedding=embedding,
            created_at=datetime.datetime.utcnow(),
        )
        self.db.add(db_job)
        self.db.commit()
        self.db.refresh(db_job)
        return self._job_to_dict(db_job)

    def get_job(self, job_id: str) -> Optional[Dict]:
        db_job = self.db.query(Job).filter(Job.id == job_id).first()
        return self._job_to_dict(db_job)

    def list_jobs(self) -> List[Dict]:
        jobs = self.db.query(Job).all()
        return [self._job_to_dict(j) for j in jobs if j is not None]
