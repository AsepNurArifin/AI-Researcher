from __future__ import annotations

import uuid
import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models import User, Resume, Job, Match, Company, Application
from app.core.security import get_password_hash
from app.services.ml import EmbeddingService
from app.services.matching import compute_match

import sys

def seed_database():
    db = SessionLocal()
    try:
        force = "--force" in sys.argv
        
        # Check if database already has users
        if db.query(User).first() is not None and not force:
            print("Database already has data. Skipping seed script. Use --force to reset and re-seed.")
            return

        if force:
            print("--- Force flag specified: Clearing existing database records ---")
            db.query(Match).delete()
            db.query(Application).delete()
            db.query(Resume).delete()
            db.query(Job).delete()
            db.query(User).delete()
            db.query(Company).delete()
            db.commit()

        print("--- Pre-loading ML Embedding model for seeding ---")
        EmbeddingService.get_model()

        print("--- Seeding Companies ---")
        acme = Company(id=str(uuid.uuid4()), name="Acme Corporation")
        wayne = Company(id=str(uuid.uuid4()), name="Wayne Enterprises")
        stark = Company(id=str(uuid.uuid4()), name="Stark Industries")
        db.add_all([acme, wayne, stark])
        db.commit()

        print("--- Seeding Users (Recruiters & Candidates) ---")
        password_hash = get_password_hash("password123")

        # Recruiters
        rec_acme = User(
            id=str(uuid.uuid4()),
            name="Alice Recruiter (Acme)",
            email="recruiter.acme@example.com",
            password_hash=password_hash,
            role="recruiter",
            company_id=acme.id
        )
        rec_wayne = User(
            id=str(uuid.uuid4()),
            name="Bruce Wayne (Wayne Ent)",
            email="recruiter.wayne@example.com",
            password_hash=password_hash,
            role="recruiter",
            company_id=wayne.id
        )
        db.add_all([rec_acme, rec_wayne])

        # Candidates
        cand1 = User(
            id=str(uuid.uuid4()),
            name="Alice Developer (Python/FastAPI)",
            email="alice.dev@example.com",
            password_hash=password_hash,
            role="candidate",
            company_id=None
        )
        cand2 = User(
            id=str(uuid.uuid4()),
            name="Bob Frontend (React/Next.js)",
            email="bob.frontend@example.com",
            password_hash=password_hash,
            role="candidate",
            company_id=None
        )
        cand3 = User(
            id=str(uuid.uuid4()),
            name="Charlie Data Scientist",
            email="charlie.data@example.com",
            password_hash=password_hash,
            role="candidate",
            company_id=None
        )
        db.add_all([cand1, cand2, cand3])
        db.commit()

        print("--- Seeding Jobs ---")
        # Job 1: Python/FastAPI Backend Developer
        job1_desc = (
            "We are looking for a Python Backend Developer with experience in FastAPI and PostgreSQL. "
            "You will design database schemas, implement API endpoints, and deploy containers using Docker. "
            "Familiarity with Git and unit testing is highly desirable."
        )
        job1 = Job(
            id=str(uuid.uuid4()),
            recruiter_id=rec_acme.id,
            company_id=acme.id,
            title="Senior Python Backend Developer",
            description=job1_desc,
            skills=["Python", "Fastapi", "Postgresql", "Docker", "Git"],
            embedding=EmbeddingService.get_embedding(job1_desc)
        )

        # Job 2: Frontend Engineer
        job2_desc = (
            "Looking for a Frontend React Engineer to build glassmorphic web applications. "
            "Requirements: strong knowledge of HTML, CSS, JavaScript, React, Next.js, and Tailwind CSS. "
            "You will craft beautiful responsive interfaces and integrate them with REST APIs."
        )
        job2 = Job(
            id=str(uuid.uuid4()),
            recruiter_id=rec_wayne.id,
            company_id=wayne.id,
            title="React Frontend Developer",
            description=job2_desc,
            skills=["Html", "Css", "Javascript", "React", "Next.js", "Tailwind Css"],
            embedding=EmbeddingService.get_embedding(job2_desc)
        )

        # Job 3: Data Scientist
        job3_desc = (
            "Join our AI research team as a Data Scientist. "
            "You should have strong skills in Python, SQL, Pandas, NumPy, and machine learning algorithms. "
            "Experience with Tableau or other BI tools is a plus."
        )
        job3 = Job(
            id=str(uuid.uuid4()),
            recruiter_id=rec_acme.id,
            company_id=acme.id,
            title="Data Scientist / ML Analyst",
            description=job3_desc,
            skills=["Python", "Sql", "Pandas", "Tableau", "Machine Learning"],
            embedding=EmbeddingService.get_embedding(job3_desc)
        )
        db.add_all([job1, job2, job3])
        db.commit()

        print("--- Seeding Resumes ---")
        # Resume Alice Dev
        r1_text = (
            "Alice Developer\nEmail: alice.dev@example.com\n"
            "Summary: Highly motivated software developer with 4 years of experience building scalable API services.\n"
            "Technical Skills: Python, FastAPI, PostgreSQL, Docker, Git, REST APIs, Unit Testing, AWS.\n"
            "Experience:\n"
            "- Backend Engineer at TechCorp: Developed microservices using FastAPI, optimized PostgreSQL queries.\n"
            "- Software Developer at StartupX: Developed internal APIs and automated deployments with Docker.\n"
            "Education: BS in Computer Science, XYZ University."
        )
        r1 = Resume(
            id=str(uuid.uuid4()),
            user_id=cand1.id,
            file_name="alice_dev_resume.pdf",
            parsed_text=r1_text,
            parsed_data={
                "skills": ["Python", "Fastapi", "Postgresql", "Docker", "Git", "Aws"],
                "education": "BS in Computer Science, XYZ University.",
                "experience": "Backend Engineer at TechCorp, Software Developer at StartupX.",
                "projects": "",
                "certifications": ""
            },
            embedding=EmbeddingService.get_embedding(r1_text)
        )

        # Resume Bob Frontend
        r2_text = (
            "Bob Frontend\nEmail: bob.frontend@example.com\n"
            "Summary: Creative UI/UX developer specialized in React and Next.js applications.\n"
            "Skills: HTML, CSS, JavaScript, React, Next.js, Tailwind CSS, TypeScript, Figma.\n"
            "Experience:\n"
            "- UI Engineer at PixelPerfect: Built responsive React pages, managed state, styled with Tailwind.\n"
            "- Web Developer Freelance: Designed customized portfolios and landing pages.\n"
            "Education: Bachelor of Design, Art College."
        )
        r2 = Resume(
            id=str(uuid.uuid4()),
            user_id=cand2.id,
            file_name="bob_frontend_resume.docx",
            parsed_text=r2_text,
            parsed_data={
                "skills": ["Html", "Css", "Javascript", "React", "Next.js", "Tailwind Css", "Typescript"],
                "education": "Bachelor of Design, Art College.",
                "experience": "UI Engineer at PixelPerfect, Web Developer Freelance.",
                "projects": "Glassmorphic personal landing pages.",
                "certifications": ""
            },
            embedding=EmbeddingService.get_embedding(r2_text)
        )

        # Resume Charlie Data
        r3_text = (
            "Charlie Data Scientist\nEmail: charlie.data@example.com\n"
            "Summary: Data Analyst and Scientist who loves finding patterns in complex datasets.\n"
            "Skills: Python, SQL, Pandas, Tableau, Machine Learning, Scikit-Learn, PyTorch.\n"
            "Experience:\n"
            "- Data Analyst at FinTech: Wrote SQL queries to build analytics dashboards in Tableau.\n"
            "- ML Intern: Prepared data pipelines and trained classification models.\n"
            "Education: MS in Statistics, ABC University."
        )
        r3 = Resume(
            id=str(uuid.uuid4()),
            user_id=cand3.id,
            file_name="charlie_data_resume.pdf",
            parsed_text=r3_text,
            parsed_data={
                "skills": ["Python", "Sql", "Pandas", "Tableau", "Machine Learning"],
                "education": "MS in Statistics, ABC University.",
                "experience": "Data Analyst at FinTech, ML Intern.",
                "projects": "",
                "certifications": ""
            },
            embedding=EmbeddingService.get_embedding(r3_text)
        )
        db.add_all([r1, r2, r3])
        db.commit()

        print("--- Seeding Applications & Match Relationships ---")
        # Alice applies to Senior Python Backend Developer (Job 1)
        m1_matched, m1_missing, m1_percentage, m1_semantic = compute_match(
            r1.parsed_data["skills"], job1.skills, resume_embedding=r1.embedding, job_embedding=job1.embedding
        )
        match1 = Match(
            id=str(uuid.uuid4()),
            resume_id=r1.id,
            job_id=job1.id,
            score=m1_percentage,
            missing_skills={"missing_skills": m1_missing, "matched_skills": m1_matched, "semantic_relevance": m1_semantic, "job_title": job1.title, "job_description_snippet": job1.description[:100]}
        )
        app1 = Application(id=str(uuid.uuid4()), job_id=job1.id, resume_id=r1.id)

        # Bob applies to React Frontend Developer (Job 2)
        m2_matched, m2_missing, m2_percentage, m2_semantic = compute_match(
            r2.parsed_data["skills"], job2.skills, resume_embedding=r2.embedding, job_embedding=job2.embedding
        )
        match2 = Match(
            id=str(uuid.uuid4()),
            resume_id=r2.id,
            job_id=job2.id,
            score=m2_percentage,
            missing_skills={"missing_skills": m2_missing, "matched_skills": m2_matched, "semantic_relevance": m2_semantic, "job_title": job2.title, "job_description_snippet": job2.description[:100]}
        )
        app2 = Application(id=str(uuid.uuid4()), job_id=job2.id, resume_id=r2.id)

        # Charlie applies to Data Scientist (Job 3)
        m3_matched, m3_missing, m3_percentage, m3_semantic = compute_match(
            r3.parsed_data["skills"], job3.skills, resume_embedding=r3.embedding, job_embedding=job3.embedding
        )
        match3 = Match(
            id=str(uuid.uuid4()),
            resume_id=r3.id,
            job_id=job3.id,
            score=m3_percentage,
            missing_skills={"missing_skills": m3_missing, "matched_skills": m3_matched, "semantic_relevance": m3_semantic, "job_title": job3.title, "job_description_snippet": job3.description[:100]}
        )
        app3 = Application(id=str(uuid.uuid4()), job_id=job3.id, resume_id=r3.id)

        # Alice also applies to Data Scientist (Job 3)
        m4_matched, m4_missing, m4_percentage, m4_semantic = compute_match(
            r1.parsed_data["skills"], job3.skills, resume_embedding=r1.embedding, job_embedding=job3.embedding
        )
        match4 = Match(
            id=str(uuid.uuid4()),
            resume_id=r1.id,
            job_id=job3.id,
            score=m4_percentage,
            missing_skills={"missing_skills": m4_missing, "matched_skills": m4_matched, "semantic_relevance": m4_semantic, "job_title": job3.title, "job_description_snippet": job3.description[:100]}
        )
        app4 = Application(id=str(uuid.uuid4()), job_id=job3.id, resume_id=r1.id)

        db.add_all([match1, match2, match3, match4])
        db.add_all([app1, app2, app3, app4])
        db.commit()

        print("--- Database successfully seeded with 3 companies, 5 users, 3 jobs, 3 resumes, and 4 job applications! ---")
        print("Recruiter login:")
        print("  - recruiter.acme@example.com (password123)")
        print("  - recruiter.wayne@example.com (password123)")
        print("Candidate login:")
        print("  - alice.dev@example.com (password123)")
        print("  - bob.frontend@example.com (password123)")
        print("  - charlie.data@example.com (password123)")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
