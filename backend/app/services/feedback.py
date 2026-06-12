from __future__ import annotations

import re
from typing import Dict, List, Tuple


# Passive / weak phrases and their action-verb replacements in English and Indonesian
WEAK_PATTERNS: List[Tuple[re.Pattern, str]] = [
    # English
    (
        re.compile(r"\bresponsible\s+for\s+(.+)", re.IGNORECASE),
        "Memimpin / Mengelola {0}",
    ),
    (
        re.compile(r"\bhelped\s+(with\s+)?(.+)", re.IGNORECASE),
        "Meningkatkan {1} (cantumkan pencapaian terukur)",
    ),
    (
        re.compile(r"\bworked\s+on\s+(.+)", re.IGNORECASE),
        "Membangun / Mengembangkan {0}",
    ),
    (
        re.compile(r"\bassisted\s+(in\s+)?(.+)", re.IGNORECASE),
        "Berkontribusi pada {1} dengan hasil...",
    ),
    (
        re.compile(r"\binvolved\s+in\s+(.+)", re.IGNORECASE),
        "Menggerakkan / Mengeksekusi {0}",
    ),
    (
        re.compile(r"\bparticipated\s+in\s+(.+)", re.IGNORECASE),
        "Berkontribusi dalam {0} dan menghasilkan...",
    ),
    # Indonesian
    (
        re.compile(r"\bbertanggung\s+jawab\s+(atas|untuk)\s+(.+)", re.IGNORECASE),
        "Memimpin / Mengelola {1}",
    ),
    (
        re.compile(r"\bmembantu\s+(dalam|untuk\s+)?(.+)", re.IGNORECASE),
        "Meningkatkan {1} (cantumkan pencapaian terukur)",
    ),
    (
        re.compile(r"\bbekerja\s+(pada|dalam|untuk)\s+(.+)", re.IGNORECASE),
        "Membangun / Mengembangkan {1}",
    ),
    (
        re.compile(r"\bterlibat\s+(dalam|pada)?\s+(.+)", re.IGNORECASE),
        "Menggerakkan / Mengeksekusi {1}",
    ),
    (
        re.compile(r"\bberpartisipasi\s+(dalam|pada)?\s+(.+)", re.IGNORECASE),
        "Berkontribusi dalam {1} dan menghasilkan...",
    ),
]


def detect_weak_phrases(resume_text: str) -> List[Dict[str, str]]:
    """Scan resume text for weak/passive phrasing and suggest improvements."""
    results: list[Dict[str, str]] = []
    seen: set[str] = set()

    for line in resume_text.split("\n"):
        stripped = line.strip()
        if not stripped or len(stripped) < 10:
            continue

        for pattern, template in WEAK_PATTERNS:
            match = pattern.search(stripped)
            if match and stripped.lower() not in seen:
                seen.add(stripped.lower())
                groups = match.groups()
                try:
                    suggestion = template.format(*[g or "" for g in groups])
                except (IndexError, KeyError):
                    suggestion = template
                results.append({
                    "phrase": stripped[:120],
                    "suggestion": suggestion[:200],
                })
                break  # one hit per line

    return results[:5]  # cap at 5


def suggest_missing_keywords(
    resume_skills: List[str],
    job_skills: List[str],
    missing_skills: List[str],
) -> List[str]:
    """Return keywords the candidate should add to their resume."""
    # Include the missing skills themselves
    keywords = list(missing_skills)

    # Add related industry terms that might help with ATS
    ats_boosters = {
        "docker": ["containerization", "CI/CD"],
        "pgvector": ["vector database", "semantic search"],
        "spacy": ["NLP pipeline", "named entity recognition"],
        "fastapi": ["REST API", "async Python"],
        "pytorch": ["deep learning", "neural networks"],
        "tensorflow": ["deep learning", "model training"],
        "aws": ["cloud computing", "AWS services"],
        "sql": ["database management", "query optimization"],
        "react": ["frontend development", "component architecture"],
        "typescript": ["type-safe JavaScript", "frontend engineering"],
    }

    for skill in missing_skills:
        key = skill.lower().strip()
        if key in ats_boosters:
            keywords.extend(ats_boosters[key])

    return sorted(set(keywords))[:10]


def generate_ats_recommendations(
    match_percentage: float,
    matched_skills: List[str],
    missing_skills: List[str],
    resume_text: str,
) -> List[str]:
    """Generate actionable ATS optimization recommendations."""
    recs: list[str] = []

    # Skill coverage advice
    if missing_skills:
        recs.append(
            f"Tambahkan {len(missing_skills)} keahlian yang kurang ke resume Anda: "
            f"{', '.join(missing_skills[:4])}."
        )

    # Keyword density
    if match_percentage < 60:
        recs.append(
            "Tingkat kecocokan kata kunci rendah. Gunakan terminologi dari deskripsi pekerjaan "
            "untuk meningkatkan skor ATS secara jujur."
        )

    # Action verbs
    passive_count = sum(
        1
        for line in resume_text.split("\n")
        if any(p.search(line) for p, _ in WEAK_PATTERNS)
    )
    if passive_count > 0:
        recs.append(
            f"Ganti {passive_count} frasa pasif/lemah dengan kata kerja aktif "
            "dan hasil yang terukur."
        )

    # Structure advice
    word_count = len(resume_text.split())
    if word_count < 150:
        recs.append(
            "Resume Anda tampak terlalu singkat. Tambahkan lebih banyak detail tentang proyek, "
            "dampak, dan teknologi yang digunakan."
        )

    # Generic best practices
    recs.append(
        "Letakkan bagian keahlian (skills) dan sertifikasi di bagian atas untuk visibilitas sistem ATS yang lebih baik."
    )
    if match_percentage >= 80:
        recs.append(
            "Kecocokan kuat! Fokus pada kuantifikasi pencapaian untuk menarik "
            "perhatian perekrut (contoh: persentase pertumbuhan, angka efisiensi)."
        )

    return recs[:6]


def generate_feedback(
    resume_text: str,
    resume_skills: List[str],
    job_skills: List[str],
    matched_skills: List[str],
    missing_skills: List[str],
    match_percentage: float,
) -> Dict:
    """Produce a full feedback payload for a candidate."""
    return {
        "weak_phrases": detect_weak_phrases(resume_text),
        "missing_keywords": suggest_missing_keywords(
            resume_skills, job_skills, missing_skills
        ),
        "ats_recommendations": generate_ats_recommendations(
            match_percentage, matched_skills, missing_skills, resume_text
        ),
    }
