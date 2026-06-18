"""
Layer 1 — Merchant Learning
Checks user-corrected merchant→category mappings passed by the backend.
These are pre-fetched from the merchant_learning table to avoid extra network calls.
"""

from app.utils.text_preprocessing import normalize_merchant


def check_merchant_learning(
    merchant: str | None,
    merchant_learning_map: dict[str, str],
) -> dict | None:
    """
    Returns {category, confidence, source} if merchant is in the learning map.
    Returns None if not found.
    """
    if not merchant or not merchant_learning_map:
        return None

    key = normalize_merchant(merchant)
    if not key:
        return None

    # Exact match first
    if key in merchant_learning_map:
        return {
            "category": merchant_learning_map[key],
            "confidence": 1.0,
            "source": "MERCHANT_LEARNING",
        }

    # Partial match — merchant name contains a known key
    for learned_merchant, category in merchant_learning_map.items():
        if learned_merchant and (learned_merchant in key or key in learned_merchant):
            return {
                "category": category,
                "confidence": 0.95,
                "source": "MERCHANT_LEARNING",
            }

    return None
