from fastapi import APIRouter, Depends
from app.core.dependencies import verify_internal_key, get_ml_classifier
from app.models.schemas import BatchCategorizationRequest, BatchCategorizationResponse
from app.services.categorization.pipeline import run_pipeline
from app.services.categorization.ml_classifier import MLClassifier

router = APIRouter(dependencies=[Depends(verify_internal_key)])


@router.post("/batch", response_model=BatchCategorizationResponse)
def categorize_batch(
    body: BatchCategorizationRequest,
    ml_classifier: MLClassifier = Depends(get_ml_classifier),
):
    results = run_pipeline(body.transactions, ml_classifier)
    return BatchCategorizationResponse(results=results)
