from __future__ import annotations

from app.services.feedback import (
    detect_weak_phrases,
    generate_ats_recommendations,
    generate_feedback,
    suggest_missing_keywords,
)


def test_detect_weak_phrases():
    text = "I was responsible for developing a new application.\nbertanggung jawab atas pengujian sistem."
    results = detect_weak_phrases(text)
    assert len(results) >= 2
    assert results[0]["phrase"] == "I was responsible for developing a new application."
    assert "Memimpin / Mengelola" in results[0]["suggestion"]
    assert "Memimpin / Mengelola" in results[1]["suggestion"]


def test_suggest_missing_keywords():
    keywords = suggest_missing_keywords(
        resume_skills=["Python"],
        job_skills=["Python", "Docker", "FastAPI"],
        missing_skills=["Docker", "FastAPI"],
    )
    # FastAPI and Docker are missing, they should boost keywords with "containerization", "CI/CD", "REST API", etc.
    assert "Docker" in keywords
    assert "FastAPI" in keywords
    assert "containerization" in keywords
    assert "REST API" in keywords


def test_generate_ats_recommendations():
    recs = generate_ats_recommendations(
        match_percentage=45.0,
        matched_skills=["Python"],
        missing_skills=["FastAPI"],
        resume_text="I was responsible for coding.",
    )
    assert len(recs) > 0
    # low score warning
    assert any("Tingkat kecocokan kata kunci rendah" in r for r in recs)
    # weak phrase warning
    assert any("Ganti" in r and "frasa pasif" in r for r in recs)


def test_generate_feedback():
    feedback = generate_feedback(
        resume_text="responsible for coding.",
        resume_skills=["Python"],
        job_skills=["Python", "FastAPI"],
        matched_skills=["Python"],
        missing_skills=["FastAPI"],
        match_percentage=50.0,
    )
    assert "weak_phrases" in feedback
    assert "missing_keywords" in feedback
    assert "ats_recommendations" in feedback
