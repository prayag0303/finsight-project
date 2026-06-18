import json
import logging
import re
from functools import lru_cache

import google.generativeai as genai

from app.core.config import settings

logger = logging.getLogger(__name__)

# Simple in-process cache: description → category (avoids re-calling Gemini)
_classification_cache: dict[str, dict] = {}


@lru_cache(maxsize=1)
def get_generative_model() -> genai.GenerativeModel:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    return genai.GenerativeModel(settings.GEMINI_MODEL)


def get_chat_model(tools=None) -> genai.GenerativeModel:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    if tools:
        return genai.GenerativeModel(settings.GEMINI_MODEL, tools=tools)
    return genai.GenerativeModel(settings.GEMINI_MODEL)


def classify_batch(descriptions: list[str]) -> list[dict]:
    """
    Call Gemini to classify a batch of transaction descriptions.
    Returns list of {category, confidence} dicts in the same order.
    Uncached items only — caller merges with cache hits.
    """
    categories = (
        "Food, Groceries, Travel, Shopping, Entertainment, "
        "Healthcare, Education, Utilities, EMI, Salary, Investment, Transfer, Others"
    )

    numbered = "\n".join(f"{i + 1}. {d}" for i, d in enumerate(descriptions))

    prompt = f"""You are a financial transaction classifier for Indian banking data.

Classify each transaction description into EXACTLY ONE category.
Available categories: {categories}

Transactions:
{numbered}

Rules:
- UPI transfers between people → Transfer
- Loan EMI payments → EMI
- Salary credits → Salary
- ATM withdrawals → Others
- Unknown → Others

Return ONLY a valid JSON array with no extra text:
[{{"index": 1, "category": "Food", "confidence": 0.95}}, ...]"""

    try:
        model = get_generative_model()
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                response_mime_type="application/json",
            ),
        )
        raw = response.text.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("```").strip()
        results = json.loads(raw)
        return results
    except Exception as e:
        logger.warning(f"Gemini batch classification failed: {e}")
        return [{"index": i + 1, "category": "Others", "confidence": 0.0} for i in range(len(descriptions))]


def classify_with_cache(descriptions: list[str]) -> list[dict]:
    """Classify with in-process cache — avoids re-calling Gemini for repeated descriptions."""
    to_classify: list[tuple[int, str]] = []
    results = [None] * len(descriptions)

    for i, desc in enumerate(descriptions):
        key = desc.upper().strip()
        if key in _classification_cache:
            results[i] = _classification_cache[key]
        else:
            to_classify.append((i, desc))

    # Process uncached items in batches
    batch_size = settings.GEMINI_BATCH_SIZE
    for batch_start in range(0, len(to_classify), batch_size):
        batch = to_classify[batch_start: batch_start + batch_size]
        batch_descs = [d for _, d in batch]
        batch_results = classify_batch(batch_descs)

        for j, (orig_idx, desc) in enumerate(batch):
            result = next(
                (r for r in batch_results if r.get("index") == j + 1),
                {"category": "Others", "confidence": 0.0},
            )
            entry = {
                "category": result.get("category", "Others"),
                "confidence": float(result.get("confidence", 0.0)),
            }
            _classification_cache[desc.upper().strip()] = entry
            results[orig_idx] = entry

    return results
