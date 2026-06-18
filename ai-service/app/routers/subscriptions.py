from fastapi import APIRouter, Depends
from app.core.dependencies import verify_internal_key
from app.models.schemas import SubscriptionRequest, SubscriptionResponse, DetectedSubscription
from app.services.subscription_detector import detect_subscriptions

router = APIRouter(dependencies=[Depends(verify_internal_key)])


@router.post("/detect", response_model=SubscriptionResponse)
def detect_subs(body: SubscriptionRequest):
    raw_txns = [t.model_dump() for t in body.transactions]
    subs = detect_subscriptions(raw_txns)
    return SubscriptionResponse(
        subscriptions=[DetectedSubscription(**s) for s in subs]
    )
