"""
5-Layer Categorization Pipeline Orchestrator

Raw Description
      ↓
extract_merchant()       ← Step 0: always runs first
      ↓
Layer 1 — Merchant Learning  (pre-resolved by backend, passed as merchant_category)
      ↓
Layer 2 — Rule Engine        (keyword RULES dict, then regex fallback)
      ↓
Layer 3 — ML Classifier      (TF-IDF + Naive Bayes, if model files exist)
      ↓ (confidence < 0.70)
Layer 4 — Gemini             (batched, cached)
      ↓
Layer 5 — Fallback           ("Others", confidence 0)
"""

import logging
from app.core.config import settings
from app.models.schemas import TransactionInput, CategorizationResult
from app.utils.text_preprocessing import extract_merchant
from app.services.categorization.rule_engine import apply_rules
from app.services.categorization.ml_classifier import MLClassifier
from app.services.categorization.gemini_classifier import classify_with_gemini

logger = logging.getLogger(__name__)

_FALLBACK: dict = {"category": "Others", "confidence": 0.0, "source": "FALLBACK", "layer": 5}

_SOURCE_TO_LAYER: dict[str, int] = {
    "MERCHANT_LEARNING": 1,
    "RULE_ENGINE": 2,
    "ML_CLASSIFIER": 3,
    "GEMINI": 4,
    "FALLBACK": 5,
}


def _is_confident(result: dict | None) -> bool:
    if result is None:
        return False
    return result.get("confidence", 0) >= settings.ML_CONFIDENCE_THRESHOLD


def run_pipeline(
    transactions: list[TransactionInput],
    ml_classifier: MLClassifier,
) -> list[CategorizationResult]:
    n = len(transactions)
    results: list[dict | None] = [None] * n
    gemini_needed: list[int] = []

    for i, tx in enumerate(transactions):
        # Step 0: extract merchant from raw description
        merchant = extract_merchant(tx.description)

        # Layer 1 — Merchant Learning (pre-resolved by backend)
        if tx.merchant_category:
            results[i] = {
                "category": tx.merchant_category,
                "confidence": 1.0,
                "source": "MERCHANT_LEARNING",
                "layer": 1,
            }
            continue

        # Layer 2 — Rule Engine (operates on extracted merchant)
        rule_result = apply_rules(merchant)
        if rule_result:
            rule_result["layer"] = 2
            results[i] = rule_result
            continue

        # Layer 3 — ML Classifier
        ml_result = ml_classifier.predict(tx.description, merchant)
        if ml_result and _is_confident(ml_result):
            ml_result["layer"] = 3
            results[i] = ml_result
            continue

        # Layer 4 — Gemini (deferred to batch below)
        gemini_needed.append(i)

    # Process all Gemini-needed transactions in one batch
    if gemini_needed:
        logger.info(f"Sending {len(gemini_needed)} transactions to Gemini")
        merchants = [extract_merchant(transactions[i].description) for i in gemini_needed]
        gemini_results = classify_with_gemini(merchants, merchants)

        for j, idx in enumerate(gemini_needed):
            r = gemini_results[j] if j < len(gemini_results) else None
            if r:
                r["layer"] = 4
            results[idx] = r if r else _FALLBACK

    return [
        CategorizationResult(
            category=r["category"] if r else "Others",
            confidence=r["confidence"] if r else 0.0,
            source=r["source"] if r else "FALLBACK",
            layer=r.get("layer", 5) if r else 5,
        )
        for r in results
    ]
