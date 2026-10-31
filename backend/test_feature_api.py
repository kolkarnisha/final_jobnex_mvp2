"""API integration coverage for ATS job uploads and recruiter workflows."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.dialects.mysql import JSON as MySQLJSON, LONGTEXT
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import main


@compiles(LONGTEXT, "sqlite")
def _compile_longtext_sqlite(_type, _compiler, **_kw):
    return "TEXT"


@compiles(MySQLJSON, "sqlite")
def _compile_mysql_json_sqlite(_type, _compiler, **_kw):
    return "JSON"


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    main.Base.metadata.create_all(engine)
    test_session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def override_session():
        session = test_session()
        try:
            yield session
        finally:
            session.close()

    main.app.dependency_overrides[main.get_db_session] = override_session
    with TestClient(main.app) as test_client:
        yield test_client
    main.app.dependency_overrides.clear()
    main.Base.metadata.drop_all(engine)
    engine.dispose()


def _sign_up(client, suffix="one"):
    response = client.post(
        "/api/auth/register",
        json={"email": f"{suffix}@example.com", "password": "password123", "name": "Recruiter"},
    )
    assert response.status_code in (200, 201), response.text


def test_job_upload_parse_and_ats_match_are_persisted(client):
    _sign_up(client)
    description = (
        "Senior Python Engineer\nCompany: Example Systems\nLocation: Remote\n"
        "Requirements:\n- 4+ years of experience with Python, FastAPI, and PostgreSQL\n"
        "Preferred Qualifications:\n- Docker and AWS"
    )
    parsed = client.post("/api/job/parse", json={"text": description})
    assert parsed.status_code == 201, parsed.text
    job = parsed.json()
    assert job["jobId"] > 0
    assert "python" in job["requiredSkills"]
    assert "docker" in job["preferredSkills"]

    uploaded = client.post(
        "/api/job/upload",
        files={"file": ("role.txt", description.encode(), "text/plain")},
    )
    assert uploaded.status_code == 201, uploaded.text
    assert uploaded.json()["sourceFile"] == "role.txt"

    match = client.post(
        "/api/analyzer/job-match",
        json={
            "resume_text": "Python engineer with 5 years of experience using FastAPI and PostgreSQL",
            "job_details": job,
        },
    )
    assert match.status_code == 201, match.text
    body = match.json()
    assert body["jobId"] == job["jobId"]
    assert 0 <= body["matchScore"] <= 100
    assert "python" in [skill.lower() for skill in body["skillGap"]["skillsFound"]]
    assert client.get("/api/applications").json()["total"] == 1


def test_recruiter_job_candidate_pipeline_notes_and_isolation(client):
    _sign_up(client)
    job_response = client.post(
        "/api/recruiter/jobs",
        json={
            "title": "Backend Engineer",
            "company": "Example Systems",
            "department": "Engineering",
            "location": "Remote",
            "experienceLevel": "3-5 Years",
            "requiredSkills": "Python, FastAPI, PostgreSQL",
            "description": "Build APIs",
        },
    )
    assert job_response.status_code == 201, job_response.text
    job = job_response.json()
    assert job["requiredSkills"] == ["Python", "FastAPI", "PostgreSQL"]

    candidate_response = client.post(
        "/api/recruiter/candidates",
        json={
            "name": "Avery Candidate",
            "email": "avery@example.com",
            "targetJobId": job["id"],
            "targetJobTitle": job["title"],
            "stage": "Applied",
            "atsScore": 82,
            "experience": "4.5 Years",
            "skills": ["Python", "FastAPI"],
            "missingSkills": ["PostgreSQL"],
            "interviewNotes": [{"author": "Recruiter", "text": "Strong API experience", "rating": 4}],
        },
    )
    assert candidate_response.status_code == 201, candidate_response.text
    candidate = candidate_response.json()
    assert candidate["interviewNotes"][0]["text"] == "Strong API experience"
    assert client.get("/api/recruiter/candidates?experience=mid&minScore=80").json()["total"] == 1

    stage_update = client.patch(
        f"/api/recruiter/candidates/{candidate['id']}/stage",
        json={"stage": "Technical Round"},
    )
    assert stage_update.status_code == 200, stage_update.text
    note = client.post(
        f"/api/recruiter/candidates/{candidate['id']}/notes",
        json={"text": "Technical round scheduled"},
    )
    assert note.status_code == 201, note.text
    detail = client.get(f"/api/recruiter/candidates/{candidate['id']}")
    assert detail.json()["stage"] == "Technical Round"
    assert detail.json()["interviewNotes"][0]["text"] == "Technical round scheduled"
    assert client.get("/api/recruiter/metrics").json()["totalJobs"] == 1
    assert client.get("/api/recruiter/analytics").json()["totalCandidates"] == 1

    _sign_up(client, "two")
    assert client.get("/api/recruiter/jobs").json()["total"] == 0
    assert client.get(f"/api/recruiter/candidates/{candidate['id']}").status_code == 404


def test_recruiter_demo_reset_maps_fixture_ids_to_persisted_ids(client):
    _sign_up(client)
    real_job = client.post(
        "/api/recruiter/jobs",
        json={"title": "Production Requisition", "company": "Real Company"},
    )
    assert real_job.status_code == 201
    response = client.post(
        "/api/recruiter/demo/reset",
        json={
            "jobs": [{
                "id": "rj-1",
                "title": "Platform Engineer",
                "company": "Example Systems",
                "requiredSkills": ["Python"],
            }],
            "candidates": [{
                "id": "c-1",
                "name": "Demo Candidate",
                "email": "demo@example.com",
                "targetJobId": "rj-1",
                "targetJobTitle": "Platform Engineer",
                "stage": "Applied",
                "atsScore": 78,
                "experience": "3 Years",
                "skills": ["Python"],
                "interviewNotes": [{
                    "author": "Recruiter",
                    "role": "Recruitment Lead",
                    "text": "Demo feedback",
                    "rating": 4,
                }],
            }],
        },
    )
    assert response.status_code == 200, response.text
    jobs = client.get("/api/recruiter/jobs").json()["jobs"]
    job = next(item for item in jobs if item["title"] == "Platform Engineer")
    assert any(item["title"] == "Production Requisition" for item in jobs)
    candidate = client.get("/api/recruiter/candidates").json()["candidates"][0]
    assert candidate["targetJobId"] == job["id"]
    assert candidate["targetJobTitle"] == job["title"]
    assert candidate["interviewNotes"][0]["text"] == "Demo feedback"

    second_reset = client.post(
        "/api/recruiter/demo/reset",
        json={
            "jobs": [{
                "id": "rj-1",
                "title": "Platform Engineer",
                "company": "Example Systems",
                "requiredSkills": ["Python"],
            }],
            "candidates": [{
                "id": "c-1",
                "name": "Demo Candidate",
                "email": "demo@example.com",
                "targetJobId": "rj-1",
                "targetJobTitle": "Platform Engineer",
                "stage": "Applied",
                "atsScore": 78,
                "experience": "3 Years",
                "skills": ["Python"],
            }],
        },
    )
    assert second_reset.status_code == 200, second_reset.text
    final_jobs = client.get("/api/recruiter/jobs").json()["jobs"]
    assert len(final_jobs) == 2
    assert any(item["title"] == "Production Requisition" for item in final_jobs)
