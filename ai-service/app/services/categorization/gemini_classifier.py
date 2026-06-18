"""
Layer 4 — Gemini Fallback Classifier
Called only when layers 1-3 fail or return low-confidence predictions.
Batches up to 20 transactions per API call to minimize Gemini usage.
"""

import logging
from app.utils.gemini_client import classify_with_cache

logger = logging.getLogger(__name__)


def classify_with_gemini(
    descriptions: list[str],
    merchants: list[str | None] | None = None,
) -> list[dict]:
    """
    Classify a list of descriptions using Gemini.
    Combines merchant + description for better accuracy.
    Returns list of {category, confidence, source}.
    """
    if not descriptions:
        return []

    combined = []
    for i, desc in enumerate(descriptions):
        merchant = (merchants[i] if merchants else None) or ""
        if merchant:
            combined.append(f"{merchant}: {desc}")
        else:
            combined.append(desc)

    raw_results = classify_with_cache(combined)

    return [
        {
            "category": r.get("category", "Others"),
            "confidence": float(r.get("confidence", 0.0)),
            "source": "GEMINI",
        }
        for r in raw_results
    ]
