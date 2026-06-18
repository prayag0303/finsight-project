from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.services.categorization.ml_classifier import MLClassifier
from app.routers import categorize, chat, insights, anomalies, subscriptions, savings

ml_classifier = MLClassifier()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load ML model at startup so first request isn't slow
    ml_classifier.load()
    yield


app = FastAPI(
    title="FinSight AI Service",
    description="AI categorization, fraud detection, insights, and chatbot",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.BACKEND_URL],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Internal-Key"],
)

app.include_router(categorize.router, prefix="/categorize", tags=["Categorization"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(insights.router, prefix="/insights", tags=["Insights"])
app.include_router(anomalies.router, prefix="/anomalies", tags=["Anomalies"])
app.include_router(subscriptions.router, prefix="/subscriptions", tags=["Subscriptions"])
app.include_router(savings.router, prefix="/savings", tags=["Savings"])


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "finsight-ai",
        "ml_model_loaded": ml_classifier.is_loaded,
    }


# Expose classifier singleton for routers via app.state
app.state.ml_classifier = ml_classifier
