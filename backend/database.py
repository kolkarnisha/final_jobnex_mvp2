"""Database configuration and SQLAlchemy model for Jobnex MVP-2.

Secrets are read from environment variables. Set DB_PASSWORD before running;
do not commit credentials to source control.
"""
import logging
import os
from contextlib import contextmanager
from functools import lru_cache

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, Text, TIMESTAMP, create_engine, func
from sqlalchemy.dialects.mysql import JSON as MySQLJSON, LONGTEXT
from sqlalchemy.orm import DeclarativeBase, Session, mapped_column, Mapped, sessionmaker

from urllib.parse import quote_plus

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

logger = logging.getLogger(__name__)

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_NAME = os.getenv("DB_NAME", "jobnex")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_URL = os.getenv("DATABASE_URL") or (
    f"mysql+mysqlconnector://{DB_USER}:{quote_plus(DB_PASSWORD)}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    if DB_PASSWORD is not None else None
)


class Base(DeclarativeBase):
    """Base for SQLAlchemy ORM models."""


class ResumeAnalyzer(Base):
    """Maps the existing resume_analyzer table; `sugesstions` typo is intentional."""
    __tablename__ = "resume_analyzer"

    analysis_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    resume_text: Mapped[str] = mapped_column(LONGTEXT, nullable=False)
    jd_text: Mapped[str] = mapped_column(LONGTEXT, nullable=False)
    created_at: Mapped[object] = mapped_column(
        TIMESTAMP, server_default=func.current_timestamp(), nullable=False
    )
    match_score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    matched_skills: Mapped[list | None] = mapped_column(MySQLJSON, nullable=True)
    missing_skills: Mapped[list | None] = mapped_column(MySQLJSON, nullable=True)
    sugesstions: Mapped[list | None] = mapped_column(MySQLJSON, nullable=True)
    certifications: Mapped[str | None] = mapped_column(Text, nullable=True)
    experience_years: Mapped[int | None] = mapped_column(Integer, nullable=True)
    region_filter: Mapped[str | None] = mapped_column(String(50), nullable=True)
    interview_prep: Mapped[str | None] = mapped_column(Text, nullable=True)
    suggested_resources: Mapped[str | None] = mapped_column(Text, nullable=True)
    dashboard_status: Mapped[str] = mapped_column(String(50), nullable=False, default="saved", server_default="saved")
    auto_apply: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="0")
    auto_refusal: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="0")
    social_login: Mapped[str | None] = mapped_column(String(20), nullable=True)
    privacy_setting: Mapped[str] = mapped_column(String(20), nullable=False, default="private", server_default="private")


@lru_cache(maxsize=1)
def get_engine():
    """Return the process-wide engine; raises clearly if DB_PASSWORD/URL is missing."""
    if not DB_URL:
        raise RuntimeError(
            "Database credentials are not configured. Set DB_PASSWORD or DATABASE_URL."
        )
    try:
        return create_engine(
            DB_URL, pool_pre_ping=True, pool_recycle=1800, pool_size=5,
            max_overflow=10, future=True,
        )
    except Exception:
        logger.exception("Could not configure SQLAlchemy engine")
        raise


@lru_cache(maxsize=1)
def _get_session_factory():
    return sessionmaker(bind=get_engine(), autoflush=False, expire_on_commit=False, class_=Session)


@contextmanager
def get_session():
    """Yield a session and reliably commit/rollback/close it.

    For FastAPI dependencies, use `get_db_session` below instead.
    """
    session = _get_session_factory()()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        logger.exception("Database transaction failed")
        raise
    finally:
        session.close()


def get_db_session():
    """FastAPI dependency yielding a session; route owns commit/rollback."""
    session = _get_session_factory()()
    try:
        yield session
    finally:
        session.close()


def init_db():
    """Create mapped tables that do not yet exist (use migrations for production changes)."""
    try:
        Base.metadata.create_all(bind=get_engine())
        logger.info("Database tables verified/created")
    except Exception:
        logger.exception("Database initialization failed")
        raise
