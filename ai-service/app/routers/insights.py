from fastapi import APIRouter, Depends
from app.core.dependencies import verify_internal_key
from app.models.schemas import InsightRequest, InsightResponse
from app.services.insights_generator import generate_monthly_insights

router = APIRouter(dependencies=[Depends(verify_internal_key)])


@router.post("/monthly", response_model=InsightResponse)
def monthly_insights(body: InsightRequest):
    result = generate_monthly_insights(body.month, body.model_dump())
    return InsightResponse(**result)
