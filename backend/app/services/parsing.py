from __future__ import annotations

import io
import re
from typing import Dict, List

import docx
import fitz  # PyMuPDF


SKILL_KEYWORDS = [
    "python",
    "nlp",
    "fastapi",
    "postgresql",
    "pgvector",
    "docker",
    "spacy",
    "pytorch",
    "tensorflow",
    "sql",
    "react",
    "typescript",
    "mlops",
    "aws",
    "scikit-learn",
    "sentence-transformers",
    "vector",
    "semantic search",
]


def sanitize_filename(filename: str) -> str:
    safe = re.sub(r"[^a-zA-Z0-9._-]", "_", filename)
    return safe.strip("._") or "resume_upload"


def extract_text(file_bytes: bytes) -> str:
    if not file_bytes:
        return ""

    # Check for PDF signature (%PDF-)
    if file_bytes.startswith(b"%PDF"):
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text()
            return text
        except Exception as e:
            # Fallback/logging
            print(f"Error parsing PDF with PyMuPDF: {e}")
            return ""

    # Check for Zip/DOCX signature (PK\x03\x04)
    elif file_bytes.startswith(b"PK\x03\x04"):
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
            return "\n".join([p.text for p in doc.paragraphs])
        except Exception as e:
            # Fallback/logging
            print(f"Error parsing DOCX with python-docx: {e}")
            return ""

    # Default fallback to UTF-8 text decoding
    try:
        return file_bytes.decode("utf-8", errors="ignore")
    except Exception:
        return ""


def extract_skills(text: str) -> List[str]:
    text_lower = text.lower()
    skills = [skill for skill in SKILL_KEYWORDS if skill in text_lower]
    return sorted(set(skill.title() if skill != "nlp" else "NLP" for skill in skills))


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
