from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers import auth, cases, evidence, timeline, bundles, specialists, marketplace, legal_analysis, collaboration, statement_of_claim, messages

Base.metadata.create_all(bind=engine)

app = FastAPI(title="LitigantAI API", version="1.0.0")

_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials="*" not in _origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(cases.router, prefix="/api/v1")
app.include_router(evidence.router, prefix="/api/v1")
app.include_router(timeline.router, prefix="/api/v1")
app.include_router(bundles.router, prefix="/api/v1")
app.include_router(specialists.router, prefix="/api/v1")
app.include_router(marketplace.router, prefix="/api/v1")
app.include_router(legal_analysis.router, prefix="/api/v1")
app.include_router(collaboration.router, prefix="/api/v1")
app.include_router(statement_of_claim.router, prefix="/api/v1")
app.include_router(messages.router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "LitigantAI API"}
