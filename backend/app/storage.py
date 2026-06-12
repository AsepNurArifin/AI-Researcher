from __future__ import annotations

import datetime
from typing import Dict, List, Optional
from uuid import uuid4
from sqlalchemy import text
from sqlalchemy.orm import Session

from .models import User, Resume, Job, Match, Company, Application


class DatabaseStore:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _company_to_dict(self, company: Company | None) -> Dict | None:
        if not company:
            return None
        return {
            "id": company.id,
            "name": company.name,
            "created_at": company.created_at,
        }

    def _user_to_dict(self, user: User | None) -> Dict | None:
        if not user:
            return None
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "password_hash": user.password_hash,
            "role": user.role,
            "company_id": user.company_id,
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
            "embedding": [float(x) for x in resume.embedding] if resume.embedding is not None else None,
            "created_at": resume.created_at,
        }

    def _job_to_dict(self, job: Job | None) -> Dict | None:
        if not job:
            return None
        return {
            "id": job.id,
            "recruiter_id": job.recruiter_id,
            "company_id": job.company_id,
            "title": job.title,
            "description": job.description,
            "skills": job.skills,
            "embedding": [float(x) for x in job.embedding] if job.embedding is not None else None,
            "created_at": job.created_at,
        }

    def create_user(self, name: str, email: str, password_hash: str, role: str, company_id: Optional[str] = None) -> Dict:
        user_id = uuid4().hex
        db_user = User(
            id=user_id,
            name=name,
            email=email,
            password_hash=password_hash,
            role=role,
            company_id=company_id,
            created_at=datetime.datetime.now(datetime.timezone.utc),
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

    def create_company(self, name: str) -> Dict:
        company_id = uuid4().hex
        db_company = Company(
            id=company_id,
            name=name,
            created_at=datetime.datetime.now(datetime.timezone.utc),
        )
        self.db.add(db_company)
        self.db.commit()
        self.db.refresh(db_company)
        return self._company_to_dict(db_company)

    def get_company(self, company_id: str) -> Optional[Dict]:
        db_company = self.db.query(Company).filter(Company.id == company_id).first()
        return self._company_to_dict(db_company)

    def get_company_by_name(self, name: str) -> Optional[Dict]:
        db_company = self.db.query(Company).filter(Company.name == name).first()
        return self._company_to_dict(db_company)

    def list_companies(self) -> List[Dict]:
        companies = self.db.query(Company).all()
        return [self._company_to_dict(c) for c in companies if c is not None]


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
            created_at=datetime.datetime.now(datetime.timezone.utc),
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

    def list_resumes_by_user(self, user_id: str, limit: int = 20, offset: int = 0) -> tuple[List[Dict], int]:
        total_count = self.db.query(Resume).filter(Resume.user_id == user_id).count()
        resumes = (
            self.db.query(Resume)
            .filter(Resume.user_id == user_id)
            .order_by(Resume.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        return [self._resume_to_dict(r) for r in resumes if r is not None], total_count

    def delete_resume(self, resume_id: str, user_id: str) -> bool:
        db_resume = self.db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == user_id).first()
        if not db_resume:
            return False
        self.db.delete(db_resume)
        self.db.commit()
        return True

    def create_job(
        self,
        recruiter_id: str,
        company_id: str,
        title: str,
        description: str,
        skills: List[str],
        embedding: Optional[List[float]] = None,
    ) -> Dict:
        job_id = uuid4().hex
        db_job = Job(
            id=job_id,
            recruiter_id=recruiter_id,
            company_id=company_id,
            title=title,
            description=description,
            skills=skills,
            embedding=embedding,
            created_at=datetime.datetime.now(datetime.timezone.utc),
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

    def list_all_jobs(self, limit: int = 20, offset: int = 0) -> tuple[List[Dict], int]:
        total_count = self.db.query(Job).count()
        jobs = (
            self.db.query(Job)
            .order_by(Job.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        return [self._job_to_dict(j) for j in jobs if j is not None], total_count

    def list_jobs_by_recruiter(self, recruiter_id: str) -> List[Dict]:
        jobs = self.db.query(Job).filter(Job.recruiter_id == recruiter_id).all()
        return [self._job_to_dict(j) for j in jobs if j is not None]

    def list_jobs_by_company(self, company_id: str, limit: int = 20, offset: int = 0) -> tuple[List[Dict], int]:
        total_count = self.db.query(Job).filter(Job.company_id == company_id).count()
        jobs = (
            self.db.query(Job)
            .filter(Job.company_id == company_id)
            .order_by(Job.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        return [self._job_to_dict(j) for j in jobs if j is not None], total_count

    def update_job(
        self,
        job_id: str,
        company_id: str,
        title: str,
        description: str,
        skills: List[str],
        embedding: Optional[List[float]] = None,
    ) -> Optional[Dict]:
        db_job = self.db.query(Job).filter(Job.id == job_id, Job.company_id == company_id).first()
        if not db_job:
            return None
        db_job.title = title
        db_job.description = description
        db_job.skills = skills
        if embedding is not None:
            db_job.embedding = embedding
        self.db.commit()
        self.db.refresh(db_job)
        return self._job_to_dict(db_job)

    # ── Match helpers ──────────────────────────────────────────────

    def _match_to_dict(self, match: Match | None) -> Dict | None:
        if not match:
            return None
        return {
            "id": match.id,
            "resume_id": match.resume_id,
            "job_id": match.job_id,
            "score": match.score,
            "missing_skills": match.missing_skills,
            "created_at": match.created_at,
        }

    def create_match(
        self,
        resume_id: str,
        job_id: str | None,
        score: float,
        missing_skills: List[str],
        matched_skills: List[str],
        semantic_relevance: float,
        job_title: str | None = None,
        job_description: str | None = None,
    ) -> Dict:
        match_id = uuid4().hex

        # If there is no real job_id we still want to track the ad-hoc match.
        # Store extra metadata in the missing_skills JSON column as an
        # enriched payload so the schema doesn't need to change.
        enriched_data = {
            "missing_skills": missing_skills,
            "matched_skills": matched_skills,
            "semantic_relevance": semantic_relevance,
            "job_title": job_title,
            "job_description_snippet": (job_description or "")[:200],
        }

        db_match = Match(
            id=match_id,
            resume_id=resume_id,
            job_id=job_id,
            score=score,
            missing_skills=enriched_data,
            created_at=datetime.datetime.now(datetime.timezone.utc),
        )
        self.db.add(db_match)
        self.db.commit()
        self.db.refresh(db_match)
        return self._match_to_dict(db_match)

    def list_matches_by_resume(self, resume_id: str) -> List[Dict]:
        matches = (
            self.db.query(Match)
            .filter(Match.resume_id == resume_id)
            .order_by(Match.created_at.desc())
            .all()
        )
        return [self._match_to_dict(m) for m in matches if m is not None]

    def list_matches_by_user(self, user_id: str, limit: int = 20, offset: int = 0) -> tuple[List[Dict], int]:
        """Return all matches for resumes owned by a given user."""
        total_count = (
            self.db.query(Match)
            .join(Resume, Match.resume_id == Resume.id)
            .filter(Resume.user_id == user_id)
            .count()
        )
        matches = (
            self.db.query(Match)
            .join(Resume, Match.resume_id == Resume.id)
            .filter(Resume.user_id == user_id)
            .order_by(Match.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        return [self._match_to_dict(m) for m in matches if m is not None], total_count

    def _application_to_dict(self, app: Application | None) -> Dict | None:
        if not app:
            return None
        return {
            "id": app.id,
            "job_id": app.job_id,
            "resume_id": app.resume_id,
            "applied_at": app.applied_at,
        }

    def create_application(self, job_id: str, resume_id: str) -> Dict:
        app_id = uuid4().hex
        db_app = Application(
            id=app_id,
            job_id=job_id,
            resume_id=resume_id,
            applied_at=datetime.datetime.now(datetime.timezone.utc),
        )
        self.db.add(db_app)
        self.db.commit()
        self.db.refresh(db_app)
        return self._application_to_dict(db_app)

    def get_applications_by_job(self, job_id: str) -> List[Dict]:
        apps = self.db.query(Application).filter(Application.job_id == job_id).all()
        return [self._application_to_dict(a) for a in apps if a is not None]

    def get_application(self, job_id: str, resume_id: str) -> Optional[Dict]:
        db_app = self.db.query(Application).filter(
            Application.job_id == job_id,
            Application.resume_id == resume_id
        ).first()
        return self._application_to_dict(db_app)

    def get_ranked_candidates(self, job_embedding: List[float], limit: int = 50) -> List[Dict]:
        job_emb_native = [float(x) for x in job_embedding]
        query = text("""
            SELECT r.id, r.user_id, r.file_name, r.parsed_text, r.parsed_data, r.embedding,
                   u.name AS candidate_name,
                   (r.embedding <=> CAST(:job_emb AS vector)) AS distance
            FROM resumes r
            JOIN users u ON u.id = r.user_id
            WHERE u.role = 'candidate'
              AND r.embedding IS NOT NULL
            ORDER BY distance ASC
            LIMIT :lim
        """)
        result = self.db.execute(query, {"job_emb": job_emb_native, "lim": limit}).all()
        
        candidates = []
        for row in result:
            emb = None
            if row.embedding is not None:
                if isinstance(row.embedding, str):
                    cleaned = row.embedding.strip('[]')
                    emb = [float(x) for x in cleaned.split(',')] if cleaned else []
                else:
                    emb = [float(x) for x in row.embedding]
            candidates.append({
                "id": row.id,
                "user_id": row.user_id,
                "file_name": row.file_name,
                "parsed_text": row.parsed_text,
                "parsed_data": row.parsed_data,
                "embedding": emb,
                "candidate_name": row.candidate_name,
                "distance": row.distance
            })
        return candidates
