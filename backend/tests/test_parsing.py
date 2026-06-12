from __future__ import annotations

from unittest.mock import MagicMock, patch

from app.services.parsing import (
    detect_file_type,
    extract_sections,
    extract_skills,
    extract_text,
    sanitize_filename,
)


def test_sanitize_filename():
    assert sanitize_filename("my resume!!.pdf") == "my_resume__.pdf"
    assert sanitize_filename("../../etc/passwd") == "etc_passwd"
    assert sanitize_filename("") == "resume_upload"


def test_detect_file_type():
    assert detect_file_type(b"%PDF-1.4...") == "pdf"
    assert detect_file_type(b"PK\x03\x04...") == "docx"
    assert detect_file_type(b"some other content") is None


def test_extract_text_empty():
    assert extract_text(b"") == ""


@patch("app.services.parsing.fitz.open")
def test_extract_text_pdf(mock_fitz_open):
    # Setup mock PDF doc
    mock_doc = MagicMock()
    mock_page = MagicMock()
    mock_page.get_text.return_value = "Parsed PDF Text"
    mock_doc.__iter__.return_value = [mock_page]
    mock_fitz_open.return_value = mock_doc

    pdf_bytes = b"%PDF-1.4..."
    result = extract_text(pdf_bytes)
    assert result == "Parsed PDF Text"
    mock_fitz_open.assert_called_once_with(stream=pdf_bytes, filetype="pdf")


@patch("app.services.parsing.docx.Document")
def test_extract_text_docx(mock_docx_document):
    # Setup mock docx doc
    mock_doc = MagicMock()
    mock_para = MagicMock()
    mock_para.text = "Parsed DOCX Text"
    mock_doc.paragraphs = [mock_para]
    mock_docx_document.return_value = mock_doc

    docx_bytes = b"PK\x03\x04..."
    result = extract_text(docx_bytes)
    assert result == "Parsed DOCX Text"


def test_extract_skills():
    text = "Experienced python developer with next.js, fastapi, and postgresql skills."
    skills = extract_skills(text)
    assert "Python" in skills
    assert "Next.Js" in skills
    assert "Fastapi" in skills
    assert "Postgresql" in skills
    assert "Java" not in skills


def test_extract_sections():
    text = """
    Pendidikan
    Stanford
    Bachelor of Science in CS

    Pengalaman Kerja
    Software Engineer at TechCorp
    Built high performance FastAPI apps.

    Proyek
    HireSense AI: resume matcher.

    Sertifikasi
    AWS Certified Cloud Practitioner
    """
    sections = extract_sections(text)
    assert "Stanford" in sections["education"]
    assert "Software Engineer at TechCorp" in sections["experience"]
    assert "resume matcher" in sections["projects"]
    assert "AWS Certified Cloud Practitioner" in sections["certifications"]
