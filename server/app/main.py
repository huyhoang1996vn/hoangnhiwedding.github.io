import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, engine, get_db
from app.models import Rsvp
from app.schemas import RsvpCreate, RsvpGuest, RsvpOut
from app.sheets import append_rsvp

logger = logging.getLogger(__name__)


def ensure_schema() -> None:
    Base.metadata.create_all(bind=engine)
    # create_all does not add columns to existing tables
    with engine.begin() as conn:
        conn.execute(
            text("ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS stay TEXT")
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_schema()
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/rsvp", status_code=201, response_model=RsvpOut)
def create_rsvp(payload: RsvpCreate, db: Session = Depends(get_db)) -> RsvpOut:
    if payload.website and payload.website.strip():
        return RsvpOut()

    row = Rsvp(
        full_name=payload.full_name,
        attendees=payload.attendees,
        stay=payload.stay,
        message=payload.message,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    try:
        append_rsvp(row)
    except Exception:
        logger.exception("Google Sheet append failed for rsvp %s", row.id)

    return RsvpOut(id=row.id)


@app.get("/rsvps", response_model=list[RsvpGuest])
def list_rsvps(db: Session = Depends(get_db)) -> list[Rsvp]:
    return db.query(Rsvp).order_by(Rsvp.created_at.desc(), Rsvp.id.desc()).all()
