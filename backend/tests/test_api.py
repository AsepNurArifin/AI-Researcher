from __future__ import annotations


def test_healthcheck(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
    assert res.json()["database"] == "connected"


def test_auth_flows_and_roles(client):
    # Register candidate
    res = client.post(
        "/register",
        json={
            "name": "Candidate One",
            "email": "cand1@example.com",
            "password": "password123",
            "role": "candidate",
        },
    )
    assert res.status_code == 201

    # Register recruiter (missing company name should fail)
    res = client.post(
        "/register",
        json={
            "name": "Recruiter One",
            "email": "rec1@example.com",
            "password": "password123",
            "role": "recruiter",
        },
    )
    assert res.status_code == 400

    # Register recruiter successfully
    res = client.post(
        "/register",
        json={
            "name": "Recruiter One",
            "email": "rec1@example.com",
            "password": "password123",
            "role": "recruiter",
            "company_name": "API Corp",
        },
    )
    assert res.status_code == 201

    # Try duplicate email registration
    res = client.post(
        "/register",
        json={
            "name": "Candidate Two",
            "email": "cand1@example.com",
            "password": "password123",
            "role": "candidate",
        },
    )
    assert res.status_code == 409  # Conflict

    # Login candidate
    res = client.post(
        "/login",
        json={"email": "cand1@example.com", "password": "password123"},
    )
    assert res.status_code == 200
    candidate_token = res.json()["access_token"]

    # Login recruiter
    res = client.post(
        "/login",
        json={"email": "rec1@example.com", "password": "password123"},
    )
    assert res.status_code == 200
    recruiter_token = res.json()["access_token"]

    # Role check: candidate access recruiter endpoints
    headers = {"Authorization": f"Bearer {candidate_token}"}
    res = client.post("/jobs", json={"title": "Test", "description": "Desc"}, headers=headers)
    assert res.status_code == 403

    # Role check: recruiter access candidate endpoints
    headers = {"Authorization": f"Bearer {recruiter_token}"}
    res = client.get("/resumes", headers=headers)
    assert res.status_code == 403


def test_job_and_candidate_ranking(client):
    # Register and login recruiter
    client.post(
        "/register",
        json={
            "name": "Recruiter Test",
            "email": "rec_test@example.com",
            "password": "password123",
            "role": "recruiter",
            "company_name": "Ranking Corp",
        },
    )
    res = client.post(
        "/login",
        json={"email": "rec_test@example.com", "password": "password123"},
    )
    rec_token = res.json()["access_token"]
    rec_headers = {"Authorization": f"Bearer {rec_token}"}

    # Register and login candidate
    client.post(
        "/register",
        json={
            "name": "Candidate Test",
            "email": "cand_test@example.com",
            "password": "password123",
            "role": "candidate",
        },
    )
    res = client.post(
        "/login",
        json={"email": "cand_test@example.com", "password": "password123"},
    )
    cand_token = res.json()["access_token"]
    cand_headers = {"Authorization": f"Bearer {cand_token}"}

    # Recruiter create job
    res = client.post(
        "/jobs",
        json={
            "title": "FastAPI Developer",
            "description": "Must know Python, FastAPI, and PostgreSQL.",
            "skills": ["Python", "FastAPI"],
        },
        headers=rec_headers,
    )
    assert res.status_code == 201
    job_id = res.json()["id"]

    # Candidate upload resume
    pdf_content = b"%PDF-1.4\nSome text content"
    files = {"file": ("resume.pdf", pdf_content, "application/pdf")}
    res = client.post("/upload-resume", files=files, headers=cand_headers)
    assert res.status_code == 200
    resume_id = res.json()["resume_id"]

    # Candidate match
    res = client.post(
        "/match-job",
        json={
            "resume_id": resume_id,
            "job_description": "FastAPI Developer with Python and PostgreSQL experience",
            "job_title": "FastAPI Developer",
        },
        headers=cand_headers,
    )
    assert res.status_code == 200

    # Recruiter rank candidates
    res = client.get(f"/jobs/{job_id}/candidates", headers=rec_headers)
    assert res.status_code == 200
    candidates = res.json()["candidates"]
    assert len(candidates) >= 1
    assert any(c["candidate_name"] == "Candidate Test" for c in candidates)


def test_file_validation_magic_numbers(client):
    # Register and login candidate
    client.post(
        "/register",
        json={
            "name": "Candidate Upload",
            "email": "cand_upload@example.com",
            "password": "password123",
            "role": "candidate",
        },
    )
    res = client.post(
        "/login",
        json={"email": "cand_upload@example.com", "password": "password123"},
    )
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Case A: Wrong extension
    files = {"file": ("malicious.exe", b"%PDF-1.4\nsome content", "application/pdf")}
    res = client.post("/upload-resume", files=files, headers=headers)
    assert res.status_code == 400
    assert "PDF or DOCX" in res.json()["detail"]

    # Case B: Correct extension but incorrect magic bytes
    files = {"file": ("resume.pdf", b"MZ\x90\x00\x03\x00\x00\x00...", "application/pdf")}
    res = client.post("/upload-resume", files=files, headers=headers)
    assert res.status_code == 400
    assert "Invalid file content" in res.json()["detail"]

    # Case C: Too large file (> 5MB)
    too_large_content = b"%PDF-1.4\n" + b"X" * (5 * 1024 * 1024 + 100)
    files = {"file": ("resume.pdf", too_large_content, "application/pdf")}
    res = client.post("/upload-resume", files=files, headers=headers)
    assert res.status_code == 413
    assert "exceeds" in res.json()["detail"]


def test_multi_tenant_isolation(client):
    # Recruiter A (Company A)
    client.post(
        "/register",
        json={
            "name": "Recruiter A",
            "email": "recA@example.com",
            "password": "password123",
            "role": "recruiter",
            "company_name": "Company A",
        },
    )
    res = client.post(
        "/login", json={"email": "recA@example.com", "password": "password123"}
    )
    token_A = res.json()["access_token"]
    headers_A = {"Authorization": f"Bearer {token_A}"}

    # Recruiter B (Company B)
    client.post(
        "/register",
        json={
            "name": "Recruiter B",
            "email": "recB@example.com",
            "password": "password123",
            "role": "recruiter",
            "company_name": "Company B",
        },
    )
    res = client.post(
        "/login", json={"email": "recB@example.com", "password": "password123"}
    )
    token_B = res.json()["access_token"]
    headers_B = {"Authorization": f"Bearer {token_B}"}

    # Recruiter A create job
    res = client.post(
        "/jobs",
        json={
            "title": "Engineer Company A",
            "description": "Python FastAPI",
            "skills": ["Python"],
        },
        headers=headers_A,
    )
    job_id = res.json()["id"]

    # Recruiter B try to access Recruiter A's job candidate ranking (should be 403 Forbidden)
    res = client.get(f"/jobs/{job_id}/candidates", headers=headers_B)
    assert res.status_code == 403


def test_pagination_endpoints(client):
    # Recruiter register and login
    client.post(
        "/register",
        json={
            "name": "Recruiter Pag",
            "email": "rec_pag@example.com",
            "password": "password123",
            "role": "recruiter",
            "company_name": "Pag Corp",
        },
    )
    res = client.post(
        "/login", json={"email": "rec_pag@example.com", "password": "password123"}
    )
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create 3 jobs
    for i in range(3):
        client.post(
            "/jobs",
            json={
                "title": f"Job {i}",
                "description": f"Description for Job {i}",
                "skills": ["Python"],
            },
            headers=headers,
        )

    # Get /jobs?limit=2&offset=0
    res = client.get("/jobs?limit=2&offset=0", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_count"] == 3
    assert len(data["items"]) == 2

    # Get /jobs?limit=2&offset=2
    res = client.get("/jobs?limit=2&offset=2", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_count"] == 3
    assert len(data["items"]) == 1


def test_delete_resume_endpoint(client):
    client.post(
        "/register",
        json={
            "name": "Candidate Delete",
            "email": "cand_del@example.com",
            "password": "password123",
            "role": "candidate",
        },
    )
    res = client.post(
        "/login", json={"email": "cand_del@example.com", "password": "password123"}
    )
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    pdf_content = b"%PDF-1.4\nSome text content"
    files = {"file": ("resume.pdf", pdf_content, "application/pdf")}
    res = client.post("/upload-resume", files=files, headers=headers)
    resume_id = res.json()["resume_id"]

    res = client.delete(f"/resumes/{resume_id}", headers=headers)
    assert res.status_code == 204

    res = client.get(f"/resume-analysis/{resume_id}", headers=headers)
    assert res.status_code == 404


def test_update_job_endpoint(client):
    client.post(
        "/register",
        json={
            "name": "Recruiter Update",
            "email": "rec_up@example.com",
            "password": "password123",
            "role": "recruiter",
            "company_name": "Update Corp",
        },
    )
    res = client.post(
        "/login", json={"email": "rec_up@example.com", "password": "password123"}
    )
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post(
        "/jobs",
        json={
            "title": "Old Job Title",
            "description": "Python developer wanted.",
            "skills": ["Python"],
        },
        headers=headers,
    )
    job_id = res.json()["id"]

    res = client.put(
        f"/jobs/{job_id}",
        json={
            "title": "New Job Title",
            "description": "FastAPI developer wanted.",
            "skills": ["FastAPI"],
        },
        headers=headers,
    )
    assert res.status_code == 200
    assert res.json()["title"] == "New Job Title"
    assert "Fastapi" in res.json()["skills"]


def test_apply_flow_endpoint(client):
    client.post(
        "/register",
        json={
            "name": "Recruiter Apply Test",
            "email": "rec_app@example.com",
            "password": "password123",
            "role": "recruiter",
            "company_name": "Apply Corp",
        },
    )
    res = client.post(
        "/login", json={"email": "rec_app@example.com", "password": "password123"}
    )
    rec_token = res.json()["access_token"]
    rec_headers = {"Authorization": f"Bearer {rec_token}"}

    res = client.post(
        "/jobs",
        json={
            "title": "Apply Job",
            "description": "Python, SQL developer.",
            "skills": ["Python", "SQL"],
        },
        headers=rec_headers,
    )
    job_id = res.json()["id"]

    client.post(
        "/register",
        json={
            "name": "Candidate Apply Test",
            "email": "cand_app@example.com",
            "password": "password123",
            "role": "candidate",
        },
    )
    res = client.post(
        "/login", json={"email": "cand_app@example.com", "password": "password123"}
    )
    cand_token = res.json()["access_token"]
    cand_headers = {"Authorization": f"Bearer {cand_token}"}

    res = client.get(f"/jobs/{job_id}/applied", headers=cand_headers)
    assert res.status_code == 200
    assert res.json()["applied"] is False

    res = client.post(f"/jobs/{job_id}/apply", headers=cand_headers)
    assert res.status_code == 400

    pdf_content = b"%PDF-1.4\nSome python text content"
    files = {"file": ("resume.pdf", pdf_content, "application/pdf")}
    client.post("/upload-resume", files=files, headers=cand_headers)

    res = client.post(f"/jobs/{job_id}/apply", headers=cand_headers)
    assert res.status_code == 201
    assert res.json()["status"] == "success"

    res = client.get(f"/jobs/{job_id}/applied", headers=cand_headers)
    assert res.status_code == 200
    assert res.json()["applied"] is True

    res = client.post(f"/jobs/{job_id}/apply", headers=cand_headers)
    assert res.status_code == 409

    res = client.get(f"/jobs/{job_id}/candidates", headers=rec_headers)
    assert res.status_code == 200
    assert any(c["candidate_name"] == "Candidate Apply Test" for c in res.json()["candidates"])
