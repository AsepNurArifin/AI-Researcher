from backend.app.core.database import SessionLocal
from backend.app.models import User, Resume, Job, Match

db = SessionLocal()
try:
    print("--- USERS ---")
    users = db.query(User).all()
    for u in users:
        print(f"ID: {u.id}, Name: {u.name}, Email: {u.email}, Role: {u.role}")

    print("\n--- RESUMES ---")
    resumes = db.query(Resume).all()
    for r in resumes:
        print(f"ID: {r.id}, User ID: {r.user_id}, File: {r.file_name}, Skills: {r.parsed_data.get('skills')}")

    print("\n--- JOBS ---")
    jobs = db.query(Job).all()
    for j in jobs:
        print(f"ID: {j.id}, Title: {j.title}, Skills: {j.skills}")

    print("\n--- MATCHES ---")
    matches = db.query(Match).all()
    for m in matches:
        print(f"Resume ID: {m.resume_id}, Job ID: {m.job_id}, Score: {m.match_percentage}%")
finally:
    db.close()
