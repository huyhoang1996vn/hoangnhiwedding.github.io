from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, engine, get_db
from app.models import Rsvp
from app.schemas import RsvpCreate, RsvpGuest, RsvpOut


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
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
        message=payload.message,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return RsvpOut(id=row.id)


@app.get("/rsvps", response_model=list[RsvpGuest])
def list_rsvps(db: Session = Depends(get_db)) -> list[Rsvp]:
    return db.query(Rsvp).order_by(Rsvp.created_at.desc(), Rsvp.id.desc()).all()
