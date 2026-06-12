from __future__ import annotations

from app.services.matching import compute_match, cosine_similarity, extract_job_skills


def test_extract_job_skills():
    description = "We need a Python developer who knows React."
    skills = extract_job_skills(description, skills_hint=["React", "Java"])
    assert "Python" in skills
    assert "React" in skills
    assert "Java" in skills


def test_cosine_similarity():
    # Identical vectors
    v1 = [1.0, 0.0, 0.0]
    v2 = [1.0, 0.0, 0.0]
    assert cosine_similarity(v1, v2) == 1.0

    # Orthogonal vectors
    v3 = [0.0, 1.0, 0.0]
    assert cosine_similarity(v1, v3) == 0.0

    # Empty or mismatched
    assert cosine_similarity(None, v1) == 0.0
    assert cosine_similarity(v1, []) == 0.0
    assert cosine_similarity([1.0], [1.0, 2.0]) == 0.0


def test_compute_match():
    # Keyword match only (no embeddings)
    matched, missing, match_pct, sem_rel = compute_match(
        resume_skills=["Python", "FastAPI"],
        job_skills=["Python", "FastAPI", "Docker"],
    )
    assert matched == ["FastAPI", "Python"]
    assert missing == ["Docker"]
    assert match_pct == round((2 / 3) * 100, 1)

    # With embeddings
    matched, missing, match_pct, sem_rel = compute_match(
        resume_skills=["Python"],
        job_skills=["Python", "React"],
        resume_embedding=[1.0, 0.0],
        job_embedding=[0.8, 0.6],  # Cosine similarity = 0.8
    )
    # match_ratio = 1/2 = 0.5
    # semantic_sim = 0.8
    # combined_score = 0.4 * 0.5 + 0.6 * 0.8 = 0.2 + 0.48 = 0.68
    # match_pct = 68.0
    assert match_pct == 68.0
    assert sem_rel == 0.8
