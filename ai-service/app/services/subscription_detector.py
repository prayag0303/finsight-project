"""
Subscription Detector

Identifies recurring charges by grouping transactions by merchant and
checking if the coefficient of variation (std/mean) of amounts is below
the threshold — a signature of fixed-price subscriptions.

Criteria:
  - Same merchant appears in 3+ distinct calendar months
  - Coefficient of Variation < 0.10
"""

import logging
from collections import defaultdict
from datetime import date, timedelta
from typing import Any

import numpy as np

from app.core.config import settings

logger = logging.getLogger(__name__)

_SUBSCRIPTION_KEYWORDS = {
    "NETFLIX": "Entertainment",
    "SPOTIFY": "Entertainment",
    "AMAZON PRIME": "Entertainment",
    "HOTSTAR": "Entertainment",
    "DISNEY": "Entertainment",
    "SONY LIV": "Entertainment",
    "SONYLIV": "Entertainment",
    "ZEE5": "Entertainment",
    "YOUTUBE PREMIUM": "Entertainment",
    "APPLE MUSIC": "Entertainment",
    "JIOSAAVN": "Entertainment",
    "GAANA": "Entertainment",
    "TATA PLAY": "Entertainment",
    "DISHTV": "Utilities",
    "AIRTEL": "Utilities",
    "JIO": "Utilities",
    "VODAFONE": "Utilities",
    "VI": "Utilities",
    "BSNL": "Utilities",
    "ACT BROADBAND": "Utilities",
    "HATHWAY": "Utilities",
    "EXCITEL": "Utilities",
    "CULT FIT": "Healthcare",
    "CULTFIT": "Healthcare",
    "GOLD GYM": "Healthcare",
    "UDEMY": "Education",
    "COURSERA": "Education",
    "LINKEDIN LEARNING": "Education",
    "UNACADEMY": "Education",
    "BYJU": "Education",
    "ADOBE": "Shopping",
    "MICROSOFT 365": "Shopping",
    "GOOGLE ONE": "Shopping",
    "ICLOUD": "Shopping",
    "DROPBOX": "Shopping",
}


def _parse_date(val: Any) -> date | None:
    if isinstance(val, date):
        return val
    if isinstance(val, str):
        try:
            return date.fromisoformat(val[:10])
        except ValueError:
            return None
    return None


def _infer_category(merchant: str) -> str:
    upper = merchant.upper()
    for keyword, cat in _SUBSCRIPTION_KEYWORDS.items():
        if keyword in upper:
            return cat
    return "Others"


def _detect_frequency(dates: list[date]) -> str:
    if len(dates) < 2:
        return "MONTHLY"
    sorted_dates = sorted(dates)
    gaps = [(sorted_dates[i + 1] - sorted_dates[i]).days for i in range(len(sorted_dates) - 1)]
    avg_gap = sum(gaps) / len(gaps)
    if avg_gap <= 10:
        return "WEEKLY"
    if avg_gap <= 35:
        return "MONTHLY"
    return "YEARLY"


def detect_subscriptions(transactions: list[dict]) -> list[dict]:
    """
    Group transactions by merchant and apply subscription criteria.
    Returns list of detected subscription dicts.
    """
    # Group by normalized merchant name
    groups: dict[str, list[dict]] = defaultdict(list)
    for t in transactions:
        merchant = (t.get("merchant") or "").strip().upper()
        if merchant:
            groups[merchant].append(t)

    subscriptions = []

    for merchant, txns in groups.items():
        amounts = [float(t["amount"]) for t in txns]
        dates = [_parse_date(t.get("date")) for t in txns]
        dates = [d for d in dates if d is not None]

        if not dates:
            continue

        # Count distinct calendar months
        unique_months = {(d.year, d.month) for d in dates}
        if len(unique_months) < settings.SUBSCRIPTION_MIN_MONTHS:
            continue

        # Check CoV
        mean = float(np.mean(amounts))
        std = float(np.std(amounts))
        cov = std / mean if mean > 0 else 1.0

        if cov >= settings.SUBSCRIPTION_COV_THRESHOLD:
            continue

        sorted_dates = sorted(dates, reverse=True)
        last_charged = sorted_dates[0]
        frequency = _detect_frequency(dates)

        # Estimate next expected date
        if frequency == "MONTHLY":
            next_exp = last_charged.replace(day=1)
            if next_exp.month == 12:
                next_exp = next_exp.replace(year=next_exp.year + 1, month=1)
            else:
                next_exp = next_exp.replace(month=next_exp.month + 1)
            next_exp = next_exp.replace(day=last_charged.day)
        elif frequency == "WEEKLY":
            next_exp = last_charged + timedelta(weeks=1)
        else:
            next_exp = last_charged.replace(year=last_charged.year + 1)

        subscriptions.append({
            "merchant": merchant,
            "averageAmount": round(mean, 2),
            "frequency": frequency,
            "lastCharged": last_charged.isoformat(),
            "nextExpected": next_exp.isoformat(),
            "transactionCount": len(txns),
            "category": _infer_category(merchant),
        })

    logger.info(f"Subscription detection: found {len(subscriptions)} subscriptions")
    return subscriptions
