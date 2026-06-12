from __future__ import annotations

from app.storage import DatabaseStore


def test_company_creation(db):
    store = DatabaseStore(db)

    # Test create company
    comp = store.create_company(name="TestCorp Storage")
    assert comp["id"] is not None
    assert comp["name"] == "TestCorp Storage"

    # Test get company
    fetched = store.get_company(comp["id"])
    assert fetched["name"] == "TestCorp Storage"

    # Test get company by name
    fetched_by_name = store.get_company_by_name("TestCorp Storage")
    assert fetched_by_name["id"] == comp["id"]


def test_user_creation(db):
    store = DatabaseStore(db)
    comp = store.create_company(name="TestCorp Storage User")

    # Test create user
    user = store.create_user(
        name="John Doe",
        email="john.doe@example.com",
        password_hash="hashedpass",
        role="recruiter",
        company_id=comp["id"],
    )
    assert user["id"] is not None
    assert user["email"] == "john.doe@example.com"
    assert user["company_id"] == comp["id"]

    # Test get user by email
    fetched = store.get_user_by_email("john.doe@example.com")
    assert fetched["id"] == user["id"]

    # Test get user by id
    fetched_by_id = store.get_user(user["id"])
    assert fetched_by_id["name"] == "John Doe"


def test_job_creation_and_listing(db):
    store = DatabaseStore(db)
    comp = store.create_company(name="TestCorp Job")
    user = store.create_user(
        name="Recruiter",
        email="recruiter.job@example.com",
        password_hash="hashedpass",
        role="recruiter",
        company_id=comp["id"],
    )

    # Create jobs
    job1 = store.create_job(
        recruiter_id=user["id"],
        company_id=comp["id"],
        title="Software Engineer",
        description="FastAPI dev",
        skills=["Python", "FastAPI"],
    )
    job2 = store.create_job(
        recruiter_id=user["id"],
        company_id=comp["id"],
        title="Data Engineer",
        description="SQL dev",
        skills=["SQL", "Python"],
    )

    # List jobs by company
    jobs, total_count = store.list_jobs_by_company(comp["id"], limit=10, offset=0)
    assert total_count == 2
    assert len(jobs) == 2
    assert any(j["id"] == job1["id"] for j in jobs)

    # Test multi-tenant isolation: list jobs for a different company
    comp2 = store.create_company(name="OtherCorp")
    jobs2, total_count2 = store.list_jobs_by_company(comp2["id"], limit=10, offset=0)
    assert total_count2 == 0
    assert len(jobs2) == 0


def test_resume_creation_and_listing(db):
    store = DatabaseStore(db)
    user = store.create_user(
        name="Candidate",
        email="candidate.resume@example.com",
        password_hash="hashedpass",
        role="candidate",
    )

    # Create resume
    resume = store.create_resume(
        user_id=user["id"],
        file_name="resume.pdf",
        parsed_text="Some experience with Python",
        parsed_data={"skills": ["Python"]},
        embedding=[0.1] * 384,
    )
    assert resume["id"] is not None
    assert resume["file_name"] == "resume.pdf"

    # List resumes by user
    resumes, total_count = store.list_resumes_by_user(user["id"], limit=10, offset=0)
    assert total_count == 1
    assert len(resumes) == 1
    assert resumes[0]["id"] == resume["id"]


def test_match_creation_and_listing(db):
    store = DatabaseStore(db)
    user = store.create_user(
        name="Candidate Match",
        email="candidate.match@example.com",
        password_hash="hashedpass",
        role="candidate",
    )
    resume = store.create_resume(
        user_id=user["id"],
        file_name="resume.pdf",
        parsed_text="Python",
        parsed_data={"skills": ["Python"]},
        embedding=[0.1] * 384,
    )

    # Create match
    match = store.create_match(
        resume_id=resume["id"],
        job_id=None,
        score=85.0,
        missing_skills=["FastAPI"],
        matched_skills=["Python"],
        semantic_relevance=0.85,
        job_title="Software Developer",
        job_description="Python developer description",
    )
    assert match["id"] is not None
    assert match["score"] == 85.0

    # List matches by user
    matches, total_count = store.list_matches_by_user(user["id"], limit=10, offset=0)
    assert total_count == 1
    assert len(matches) == 1
    assert matches[0]["id"] == match["id"]


def test_application_creation(db):
    store = DatabaseStore(db)
    comp = store.create_company(name="TestCorp App")
    recruiter = store.create_user(
        name="Recruiter App",
        email="recruiter.app@example.com",
        password_hash="hashedpass",
        role="recruiter",
        company_id=comp["id"],
    )
    candidate = store.create_user(
        name="Candidate App",
        email="candidate.app@example.com",
        password_hash="hashedpass",
        role="candidate",
    )
    job = store.create_job(
        recruiter_id=recruiter["id"],
        company_id=comp["id"],
        title="Developer",
        description="Coding",
        skills=["Coding"],
    )
    resume = store.create_resume(
        user_id=candidate["id"],
        file_name="resume.pdf",
        parsed_text="Coding skills",
        parsed_data={"skills": ["Coding"]},
        embedding=[0.1] * 384,
    )

    # Create application
    app = store.create_application(job_id=job["id"], resume_id=resume["id"])
    assert app["id"] is not None
    assert app["job_id"] == job["id"]
    assert app["resume_id"] == resume["id"]

    # Get applications by job
    apps = store.get_applications_by_job(job["id"])
    assert len(apps) == 1
    assert apps[0]["id"] == app["id"]
