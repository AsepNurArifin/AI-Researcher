from __future__ import annotations

import io
import docx
import fitz
import sys

# Add backend directory to sys.path so we can import from backend.app
sys.path.append(".")

from backend.app.services.parsing import extract_text, extract_sections, extract_skills
from backend.app.services.ml import EmbeddingService
from backend.app.services.matching import compute_match, cosine_similarity


def generate_sample_pdf() -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text(
        (50, 50),
        "John Doe\n"
        "Education\n"
        "Bachelor of Computer Science, Indonesia University\n"
        "Experience\n"
        "Python Developer at Google for 2 years. Built FastAPI apps with PostgreSQL.\n"
        "Certifications\n"
        "AWS Certified Developer, Docker Specialist Certification\n"
        "Skills\n"
        "Python, FastAPI, PostgreSQL, Docker, Spacy, PyTorch, SQL"
    )
    return doc.write()


def generate_sample_docx() -> bytes:
    doc = docx.Document()
    doc.add_paragraph(
        "Jane Smith\n"
        "Education\n"
        "Master of Data Science, Stanford University\n"
        "Experience\n"
        "Machine Learning Engineer at OpenAI. Worked on NLP, PyTorch and Scikit-Learn.\n"
        "Projects\n"
        "Vector search engine using pgvector and semantic search.\n"
        "Skills\n"
        "Python, NLP, PyTorch, Scikit-Learn, Pgvector, Semantic Search"
    )
    stream = io.BytesIO()
    doc.save(stream)
    return stream.getvalue()


def test_pipeline():
    print("--- 1. Generating sample PDF & DOCX ---")
    pdf_bytes = generate_sample_pdf()
    docx_bytes = generate_sample_docx()
    print(f"Generated PDF ({len(pdf_bytes)} bytes) and DOCX ({len(docx_bytes)} bytes) successfully.\n")

    print("--- 2. Testing PDF Text Extraction & Section Parsing ---")
    pdf_text = extract_text(pdf_bytes)
    print("Extracted PDF Text length:", len(pdf_text))
    pdf_sections = extract_sections(pdf_text)
    print("Extracted PDF Sections:")
    for k, v in pdf_sections.items():
        print(f"  [{k}]: {v[:80]}...")
    pdf_skills = extract_skills(pdf_text)
    print("Extracted PDF Skills:", pdf_skills)
    assert "Fastapi" in pdf_skills
    assert "Postgresql" in pdf_skills
    print("PDF Parsing & Heuristics Verification: SUCCESS\n")

    print("--- 3. Testing DOCX Text Extraction & Section Parsing ---")
    docx_text = extract_text(docx_bytes)
    print("Extracted DOCX Text length:", len(docx_text))
    docx_sections = extract_sections(docx_text)
    print("Extracted DOCX Sections:")
    for k, v in docx_sections.items():
        print(f"  [{k}]: {v[:80]}...")
    docx_skills = extract_skills(docx_text)
    print("Extracted DOCX Skills:", docx_skills)
    assert "NLP" in docx_skills
    assert "Pytorch" in docx_skills
    print("DOCX Parsing & Heuristics Verification: SUCCESS\n")

    print("--- 4. Testing ML Embedding Generation ---")
    print("Loading SentenceTransformer model all-MiniLM-L6-v2 (this might take a few seconds on first run)...")
    pdf_emb = EmbeddingService.get_embedding(pdf_text)
    docx_emb = EmbeddingService.get_embedding(docx_text)
    print("PDF Embedding Dimension:", len(pdf_emb))
    print("DOCX Embedding Dimension:", len(docx_emb))
    assert len(pdf_emb) == 384
    assert len(docx_emb) == 384
    print("Embedding Generation Verification: SUCCESS\n")

    print("--- 5. Testing Semantic Matching calculations ---")
    # Job requirements
    job_desc = "Looking for a Python Developer to build FastAPI microservices. Experience with PostgreSQL and Docker is required."
    job_skills = ["Python", "Fastapi", "Postgresql", "Docker", "NLP"]
    job_emb = EmbeddingService.get_embedding(job_desc)

    print("Matching Job Description against PDF Resume:")
    matched, missing, match_pct, sem_rel = compute_match(
        pdf_skills,
        job_skills,
        resume_embedding=pdf_emb,
        job_embedding=job_emb
    )
    print(f"  Matched Skills: {matched}")
    print(f"  Missing Skills: {missing}")
    print(f"  Semantic Relevance: {sem_rel}")
    print(f"  Overall Match Percentage (40% skills + 60% semantic): {match_pct}%")
    
    # Assertions
    assert match_pct > 0
    assert sem_rel > 0
    print("Matching calculations Verification: SUCCESS\n")

    print("==================================================")
    print("ALL PIPELINE TESTS PASSED SUCCESSFULLY!")
    print("==================================================")


if __name__ == "__main__":
    test_pipeline()
