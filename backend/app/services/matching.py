from __future__ import annotations

import math
from typing import List, Tuple

from .parsing import extract_skills


def extract_job_skills(description: str, skills_hint: List[str] | None = None) -> List[str]:
    hints = [skill.strip() for skill in (skills_hint or []) if skill.strip()]
    inferred = extract_skills(description)
    combined = {skill for skill in hints + inferred}
    return sorted(combined)


def cosine_similarity(v1: List[float] | None, v2: List[float] | None) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot_product = sum(a * b for a, b in zip(v1, v2))
    magnitude_v1 = math.sqrt(sum(a * a for a in v1))
    magnitude_v2 = math.sqrt(sum(b * b for b in v2))
    if magnitude_v1 == 0 or magnitude_v2 == 0:
        return 0.0
    return dot_product / (magnitude_v1 * magnitude_v2)


def compute_match(
    resume_skills: List[str],
    job_skills: List[str],
    resume_embedding: List[float] | None = None,
    job_embedding: List[float] | None = None,
) -> Tuple[List[str], List[str], float, float]:
    if not job_skills:
        return [], [], 0.0, 0.0

    resume_set = {skill.lower() for skill in resume_skills}
    job_set = {skill.lower() for skill in job_skills}
    matched = sorted({skill for skill in job_skills if skill.lower() in resume_set})
    missing = sorted({skill for skill in job_skills if skill.lower() not in resume_set})
    
    # Keyword/skill match ratio (Jaccard-like index on job requirements)
    match_ratio = len(matched) / max(len(job_set), 1)
    
    if resume_embedding and job_embedding:
        semantic_sim = cosine_similarity(resume_embedding, job_embedding)
        # Bounded between 0 and 1
        semantic_sim = max(0.0, min(1.0, semantic_sim))
        
        # Weighted score: 40% skills match + 60% semantic similarity
        combined_score = 0.4 * match_ratio + 0.6 * semantic_sim
        match_percentage = round(combined_score * 100, 1)
        semantic_relevance = round(semantic_sim, 2)
    else:
        # Fallback to keyword match
        match_percentage = round(match_ratio * 100, 1)
        semantic_relevance = round(match_ratio, 2)
        
    return matched, missing, match_percentage, semantic_relevance
