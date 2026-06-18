from fastapi import APIRouter, Depends
from app.core.dependencies import verify_internal_key
from app.models.schemas import AnomalyRequest, AnomalyResponse, AnomalyAlert
from app.services.anomaly_detection import detect_all

router = APIRouter(dependencies=[Depends(verify_internal_key)])


@router.post("/detect", response_model=AnomalyResponse)
def detect_anomalies(body: AnomalyRequest):
    raw_txns = [t.model_dump() for t in body.transactions]
    alerts = detect_all(raw_txns, body.userStats.avgAmount)
    return AnomalyResponse(
        anomalies=[AnomalyAlert(**a) for a in alerts]
    )
