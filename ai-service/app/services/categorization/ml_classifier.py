"""
Layer 3 — Machine Learning Classifier
TF-IDF Vectorizer + Multinomial Naive Bayes (single pipeline).

Run training/train_classifier.py to generate models/classifier_pipeline.pkl.
Falls back to the legacy two-file format (transaction_classifier.pkl +
tfidf_vectorizer.pkl) if the pipeline file is not found.
"""

import logging
from pathlib import Path

import joblib
import numpy as np

logger = logging.getLogger(__name__)

MODELS_DIR     = Path(__file__).parent.parent.parent.parent.parent / "models"
PIPELINE_PATH  = MODELS_DIR / "classifier_pipeline.pkl"
# Legacy paths — used only when pipeline file is absent
_LEGACY_CLF    = MODELS_DIR / "transaction_classifier.pkl"
_LEGACY_VEC    = MODELS_DIR / "tfidf_vectorizer.pkl"


class MLClassifier:
    def __init__(self):
        self._pipeline  = None   # single sklearn Pipeline
        self._clf       = None   # legacy: classifier only
        self._vec       = None   # legacy: vectorizer only
        self.is_loaded  = False
        self.classes_: list[str] = []

    def load(self) -> bool:
        if self.is_loaded:
            return True

        # Prefer single-pipeline format
        if PIPELINE_PATH.exists():
            try:
                self._pipeline = joblib.load(PIPELINE_PATH)
                self.classes_  = list(self._pipeline.classes_)
                self.is_loaded = True
                logger.info(f"ML pipeline loaded from {PIPELINE_PATH.name}. Classes: {self.classes_}")
                return True
            except Exception as e:
                logger.error(f"Failed to load pipeline: {e}")

        # Fall back to legacy two-file format
        if _LEGACY_CLF.exists() and _LEGACY_VEC.exists():
            try:
                self._clf     = joblib.load(_LEGACY_CLF)
                self._vec     = joblib.load(_LEGACY_VEC)
                self.classes_ = list(self._clf.classes_)
                self.is_loaded = True
                logger.info("ML classifier loaded (legacy two-file format).")
                return True
            except Exception as e:
                logger.error(f"Failed to load legacy model: {e}")

        logger.warning(
            "ML model files not found. "
            "Run training/train_classifier.py to generate models/classifier_pipeline.pkl. "
            "Falling back to Gemini for all transactions."
        )
        return False

    def _transform_predict(self, texts: list[str]) -> list[tuple[str, float]]:
        """Return (category, confidence) pairs for a list of texts."""
        if self._pipeline is not None:
            probas = self._pipeline.predict_proba(texts)
        else:
            X = self._vec.transform(texts)
            probas = self._clf.predict_proba(X)

        results = []
        for proba in probas:
            max_idx    = int(np.argmax(proba))
            results.append((self.classes_[max_idx], float(proba[max_idx])))
        return results

    def predict(self, description: str, merchant: str | None = None) -> dict | None:
        if not self.is_loaded:
            return None
        try:
            text = f"{merchant or ''} {description}".upper().strip()
            if not text:
                return None
            category, conf = self._transform_predict([text])[0]
            return {
                "category":   category,
                "confidence": round(conf, 4),
                "source":     "ML_CLASSIFIER",
            }
        except Exception as e:
            logger.warning(f"ML prediction failed: {e}")
            return None

    def predict_batch(
        self,
        descriptions: list[str],
        merchants:    list[str | None],
    ) -> list[dict | None]:
        if not self.is_loaded:
            return [None] * len(descriptions)
        try:
            texts = [
                f"{m or ''} {d}".upper().strip()
                for d, m in zip(descriptions, merchants)
            ]
            pairs = self._transform_predict(texts)
            return [
                {"category": cat, "confidence": round(conf, 4), "source": "ML_CLASSIFIER"}
                for cat, conf in pairs
            ]
        except Exception as e:
            logger.warning(f"ML batch prediction failed: {e}")
            return [None] * len(descriptions)
