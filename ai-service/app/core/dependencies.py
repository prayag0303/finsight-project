from fastapi import Header, HTTPException, Request
from app.core.config import settings
from app.services.categorization.ml_classifier import MLClassifier


def verify_internal_key(x_internal_key: str = Header(...)):
    if x_internal_key != settings.INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")


def get_ml_classifier(request: Request) -> MLClassifier:
    return request.app.state.ml_classifier
