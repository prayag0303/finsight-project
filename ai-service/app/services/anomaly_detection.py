"""
Fraud & Anomaly Detection

Three detection strategies:
1. Duplicate Detection  — same merchant + same amount within 24 hours
2. Large Transaction    — amount > 3x user's average
3. Spending Spike       — Z-Score (< 30 debit history) or Isolation Forest (≥ 30)
"""

import logging
from datetime import datetime, timezone
from typing import Any

import numpy as np
from sklearn.ensemble import IsolationForest

from app.core.config import settings

logger = logging.getLogger(__name__)


def _parse_dt(val: Any) -> datetime | None:
    if isinstance(val, datetime):
        return val
    if isinstance(val, str):
        try:
            return datetime.fromisoformat(val.replace("Z", "+00:00"))
        except ValueError:
            return None
    return None


def _hours_between(dt1: datetime, dt2: datetime) -> float:
    if dt1.tzinfo is None:
        dt1 = dt1.replace(tzinfo=timezone.utc)
    if dt2.tzinfo is None:
        dt2 = dt2.replace(tzinfo=timezone.utc)
    return abs((dt1 - dt2).total_seconds()) / 3600


def detect_duplicates(transactions: list[dict]) -> list[dict]:
    alerts = []
    seen: set[str] = set()

    for i, t1 in enumerate(transactions):
        for t2 in transactions[i + 1:]:
            pair_key = "-".join(sorted([t1["id"], t2["id"]]))
            if pair_key in seen:
                continue

            if (
                t1.get("merchant")
                and t1["merchant"] == t2.get("merchant")
                and abs(float(t1["amount"]) - float(t2["amount"])) < 0.01
            ):
                dt1 = _parse_dt(t1.get("createdAt") or t1.get("date"))
                dt2 = _parse_dt(t2.get("createdAt") or t2.get("date"))
                if dt1 and dt2 and _hours_between(dt1, dt2) <= settings.FRAUD_DUPLICATE_HOURS:
                    seen.add(pair_key)
                    alerts.append({
                        "transactionId": t2["id"],
                        "alertType": "DUPLICATE",
                        "description": (
                            f"Possible duplicate charge of ₹{float(t2['amount']):.0f} "
                            f"from {t2['merchant']} within {settings.FRAUD_DUPLICATE_HOURS} hours."
                        ),
                    })

    return alerts


def detect_large_transactions(transactions: list[dict], avg_amount: float) -> list[dict]:
    if avg_amount <= 0:
        return []

    alerts = []
    threshold = avg_amount * settings.FRAUD_LARGE_TX_MULTIPLIER

    for t in transactions:
        if t.get("type", "").upper() != "DEBIT":
            continue
        amount = float(t["amount"])
        if amount > threshold:
            alerts.append({
                "transactionId": t["id"],
                "alertType": "LARGE_TRANSACTION",
                "description": (
                    f"Large transaction: ₹{amount:.0f} from {t.get('merchant', 'Unknown')}. "
                    f"This is {amount / avg_amount:.1f}x your average transaction."
                ),
            })

    return alerts


def detect_spending_spikes(transactions: list[dict]) -> list[dict]:
    debits = [t for t in transactions if t.get("type", "").upper() == "DEBIT"]
    if len(debits) < 3:
        return []

    amounts = np.array([float(t["amount"]) for t in debits])
    alerts = []

    if len(debits) < 30:
        # Z-Score method for limited history
        mean = np.mean(amounts)
        std = np.std(amounts)
        if std == 0:
            return []
        z_scores = np.abs((amounts - mean) / std)
        for t, z in zip(debits, z_scores):
            if z > settings.FRAUD_ZSCORE_THRESHOLD:
                alerts.append({
                    "transactionId": t["id"],
                    "alertType": "SPENDING_SPIKE",
                    "description": (
                        f"Unusual spending: ₹{float(t['amount']):.0f} from "
                        f"{t.get('merchant', 'Unknown')} "
                        f"(Z-score: {z:.1f}, significantly above your normal spending)."
                    ),
                })
    else:
        # Isolation Forest for sufficient history
        X = amounts.reshape(-1, 1)
        clf = IsolationForest(
            contamination=settings.FRAUD_ISOLATION_CONTAMINATION,
            random_state=42,
        )
        preds = clf.fit_predict(X)
        scores = clf.decision_function(X)  # negative = more anomalous

        for t, pred, score in zip(debits, preds, scores):
            if pred == -1:
                alerts.append({
                    "transactionId": t["id"],
                    "alertType": "SPENDING_SPIKE",
                    "description": (
                        f"Anomalous spending detected: ₹{float(t['amount']):.0f} "
                        f"from {t.get('merchant', 'Unknown')} "
                        f"(anomaly score: {abs(score):.2f})."
                    ),
                })

    return alerts


def detect_all(transactions: list[dict], avg_amount: float) -> list[dict]:
    """Run all three detectors. Deduplicate alerts by transactionId + alertType."""
    all_alerts = []
    all_alerts.extend(detect_duplicates(transactions))
    all_alerts.extend(detect_large_transactions(transactions, avg_amount))
    all_alerts.extend(detect_spending_spikes(transactions))

    # Deduplicate
    seen: set[tuple] = set()
    unique = []
    for a in all_alerts:
        key = (a["transactionId"], a["alertType"])
        if key not in seen:
            seen.add(key)
            unique.append(a)

    logger.info(f"Anomaly detection: {len(unique)} alerts from {len(transactions)} transactions")
    return unique
