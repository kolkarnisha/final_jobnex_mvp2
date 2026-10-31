"""Tests for job-description parsing and document text extraction."""
import io

import pytest

from job_service import extract_job_details, extract_uploaded_text


def test_extract_job_details_returns_structured_requirements():
    details = extract_job_details(
        "Senior Python Engineer\n"
        "Company: Example Systems\n"
        "Location: Remote\n"
        "Requirements:\n"
        "- 4+ years of experience with Python, FastAPI, and PostgreSQL\n"
        "Preferred Qualifications:\n"
        "- Docker and AWS\n"
        "Responsibilities:\n"
        "- Build and maintain scalable services and APIs."
    )

    assert details["title"] == "Senior Python Engineer"
    assert details["company"] == "Example Systems"
    assert details["location"] == "Remote"
    assert {"python", "fastapi", "postgresql"} <= set(details["requiredSkills"])
    assert {"docker", "aws"} <= set(details["preferredSkills"])
    assert details["experience"] == "4+ years of experience"
    assert details["responsibilities"] == ["Build and maintain scalable services and APIs."]


def test_extract_text_file_and_reject_unsupported_or_empty_files():
    text = "Python backend engineer with FastAPI"
    assert extract_uploaded_text("role.txt", text.encode()) == text

    with pytest.raises(ValueError, match="Only PDF, DOCX, and TXT"):
        extract_uploaded_text("role.doc", b"legacy word document")
    with pytest.raises(ValueError, match="empty"):
        extract_uploaded_text("role.txt", b"")


def test_extract_docx_text_when_dependency_is_available():
    docx = pytest.importorskip("docx")
    document = docx.Document()
    document.add_paragraph("Python engineer")
    document.add_paragraph("Requires FastAPI and PostgreSQL")
    content = io.BytesIO()
    document.save(content)

    assert "Python engineer" in extract_uploaded_text("role.docx", content.getvalue())


def test_reject_invalid_pdf_signature():
    with pytest.raises(ValueError, match="valid PDF"):
        extract_uploaded_text("role.pdf", b"not a pdf document")


def test_extract_pdf_without_readable_text_is_rejected():
    pypdf = pytest.importorskip("pypdf")
    writer = pypdf.PdfWriter()
    writer.add_blank_page(width=100, height=100)
    content = io.BytesIO()
    writer.write(content)

    with pytest.raises(ValueError, match="No readable"):
        extract_uploaded_text("role.pdf", content.getvalue())
