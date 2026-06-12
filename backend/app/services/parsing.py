from __future__ import annotations

import io
import logging
import re
from typing import Dict, List

import docx
import fitz  # PyMuPDF

logger = logging.getLogger("hiresense")

SKILL_KEYWORDS = [
    # Programming Languages
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust",
    "ruby", "php", "swift", "kotlin", "scala", "r", "matlab", "perl", "dart",
    # Web Frameworks & Libraries
    "react", "angular", "vue", "next.js", "express", "django", "flask", "fastapi",
    "spring boot", "laravel", "rails", "svelte",
    # Mobile
    "react native", "flutter", "android", "ios",
    # Data & AI/ML
    "nlp", "pytorch", "tensorflow", "scikit-learn", "pandas", "numpy",
    "machine learning", "deep learning", "computer vision", "data science",
    "data analysis", "data engineering", "big data",
    "spacy", "sentence-transformers", "hugging face", "keras",
    # Databases
    "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
    "pgvector", "firebase", "supabase", "sqlite", "oracle", "cassandra",
    # Cloud & DevOps
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
    "ci/cd", "jenkins", "github actions", "gitlab ci",
    # Tools & Platforms
    "git", "linux", "nginx", "apache", "graphql", "rest api",
    "microservices", "kafka", "rabbitmq",
    # Data Visualization
    "tableau", "power bi", "matplotlib", "d3.js",
    # Other Tech
    "blockchain", "web3", "cybersecurity", "networking",
    "agile", "scrum", "mlops", "devops",
    "html", "css", "sass", "tailwind",
    "node.js", "webpack", "vite",
    # Semantic / Vector
    "vector", "semantic search", "embedding",
    # Soft skills / methodologies
    "project management", "leadership", "communication",
]


def sanitize_filename(filename: str) -> str:
    safe = re.sub(r"[^a-zA-Z0-9._-]", "_", filename)
    return safe.strip("._") or "resume_upload"


def detect_file_type(file_bytes: bytes) -> Optional[str]:
    if file_bytes.startswith(b"%PDF"):
        return "pdf"
    elif file_bytes.startswith(b"PK\x03\x04"):
        # Both ZIP and DOCX start with PK\x03\x04
        return "docx"
    return None


def extract_text(file_bytes: bytes) -> str:
    if not file_bytes:
        return ""

    file_type = detect_file_type(file_bytes)

    if file_type == "pdf":
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text()
            return text
        except Exception as e:
            logger.error("Error parsing PDF with PyMuPDF: %s", e)
            return ""

    elif file_type == "docx":
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
            return "\n".join([p.text for p in doc.paragraphs])
        except Exception as e:
            logger.error("Error parsing DOCX with python-docx: %s", e)
            return ""

    return ""


ACRONYMS = {"nlp", "sql", "aws", "mlops", "ai", "api", "ui", "ux", "ci", "cd",
             "gcp", "html", "css", "ios", "ci/cd", "d3.js"}

def _format_skill(skill: str) -> str:
    if skill.lower() in ACRONYMS:
        return skill.upper()
    return skill.title()

def extract_skills(text: str) -> List[str]:
    text_lower = text.lower()
    pattern = r'\b' + r'\b|\b'.join(re.escape(s) for s in SKILL_KEYWORDS) + r'\b'
    skills = [skill for skill in SKILL_KEYWORDS if re.search(r'\b' + re.escape(skill) + r'\b', text_lower)]
    return sorted(set(_format_skill(skill) for skill in skills))


def extract_sections(text: str) -> Dict[str, str]:
    sections = {
        "education": "",
        "experience": "",
        "projects": "",
        "certifications": "",
    }
    
    if not text.strip():
        for key in sections:
            sections[key] = "Not detected"
        return sections

    lines = text.split("\n")
    current_section = None

    # Keywords corresponding to sections
    headers = {
        "education": ["education", "academic", "study", "university", "school", "degree", "edukasi", "pendidikan"],
        "experience": ["experience", "work", "employment", "history", "career", "professional", "pengalaman kerja", "pengalaman"],
        "projects": ["project", "portfolio", "personal project", "proyek"],
        "certifications": ["certification", "certif", "license", "award", "sertifikasi", "sertifikat"],
    }

    for line in lines:
        clean_line = line.strip().lower()
        if not clean_line:
            continue

        # Detect headers based on keywords and length constraint (< 40 characters)
        header_detected = False
        for sec_name, keywords in headers.items():
            if any(kw == clean_line or clean_line.startswith(kw + " ") or clean_line.endswith(" " + kw) for kw in keywords) and len(clean_line) < 40:
                current_section = sec_name
                header_detected = True
                break

        if header_detected:
            continue

        if current_section:
            sections[current_section] += line + "\n"

    # Post-process sections
    for sec_name in sections:
        sections[sec_name] = sections[sec_name].strip() or "Not detected"

    return sections
