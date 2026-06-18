from fastapi import APIRouter, Depends
from app.core.dependencies import verify_internal_key
from app.models.schemas import SavingsRequest, SavingsResponse, SavingsOpportunity
from app.services.savings_engine import generate_opportunities

router = APIRouter(dependencies=[Depends(verify_internal_key)])


@router.post("/opportunities", response_model=SavingsResponse)
def savings_opportunities(body: SavingsRequest):
    opportunities, total = generate_opportunities(
        body.summary,
        body.categoryBreakdown,
        body.subscriptions,
    )
    return SavingsResponse(
        opportunities=[SavingsOpportunity(**o) for o in opportunities],
        totalPotentialSaving=total,
    )
