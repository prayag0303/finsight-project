"""
ML Training Pipeline — FinSight Transaction Classifier
Single TF-IDF + Multinomial NB pipeline saved as models/classifier_pipeline.pkl

Datasets (Format D — place in finsight/ai-service/training/):
  FinSight_Demo_Dataset_1000plus.csv
  FinSight_Improved_Merchant_Dataset.csv

Usage (from finsight/ai-service/ directory):
  python training/train_classifier.py

Expected accuracy: 85%+ with the combined datasets.
"""

import sys
import logging
from pathlib import Path

import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

# Add project root to path so app imports work
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

TRAINING_DIR = ROOT / "training"
MODELS_DIR   = ROOT / "models"
MODELS_DIR.mkdir(exist_ok=True)

PIPELINE_PATH = MODELS_DIR / "classifier_pipeline.pkl"

CATEGORIES = [
    "Food", "Groceries", "Travel", "Shopping", "Entertainment",
    "Healthcare", "Education", "Utilities", "EMI", "Salary",
    "Investment", "Transfer", "Others",
]


def load_datasets() -> pd.DataFrame:
    """Load both Format D datasets and combine them."""
    ds1 = TRAINING_DIR / "FinSight_Demo_Dataset_1000plus.csv"
    ds2 = TRAINING_DIR / "FinSight_Improved_Merchant_Dataset.csv"

    frames = []
    for path in (ds1, ds2):
        if path.exists():
            logger.info(f"Loading {path.name} ({path.stat().st_size // 1024}KB)")
            frames.append(pd.read_csv(path))
        else:
            logger.warning(f"Dataset not found: {path}")

    if not frames:
        logger.warning("No datasets found — using synthetic data for testing only")
        return _synthetic_data()

    df = pd.concat(frames, ignore_index=True)
    logger.info(f"Combined dataset: {len(df)} rows")
    return df


def prepare(df: pd.DataFrame) -> tuple[list[str], list[str]]:
    """Build feature text from merchant + description; use expected_category as label."""
    # Use merchant + description columns (both present in Format D)
    df = df.copy()
    df["merchant"]     = df["merchant"].fillna("").astype(str)
    df["description"]  = df["description"].fillna("").astype(str)
    df["text"]         = (df["merchant"] + " " + df["description"]).str.upper().str.strip()
    df["label"]        = df["expected_category"].astype(str).str.strip()

    df = df.dropna(subset=["text", "label"])
    df = df[df["label"].isin(CATEGORIES)]

    logger.info(f"Clean dataset: {len(df)} rows")
    logger.info(f"Category distribution:\n{df['label'].value_counts().to_string()}")

    return df["text"].tolist(), df["label"].tolist()


def _synthetic_data() -> pd.DataFrame:
    """Minimal fallback when no real datasets are present."""
    samples = [
        ("ZOMATO", "Food Order", "Food"),
        ("SWIGGY", "Food Delivery", "Food"),
        ("DOMINOS", "Pizza Order", "Food"),
        ("STARBUCKS", "Coffee", "Food"),
        ("BIGBASKET", "Grocery Order", "Groceries"),
        ("DMART", "Grocery Shopping", "Groceries"),
        ("ZEPTO", "Quick Commerce", "Groceries"),
        ("BLINKIT", "Instant Delivery", "Groceries"),
        ("IRCTC", "Train Ticket", "Travel"),
        ("OLA", "Cab Ride", "Travel"),
        ("UBER", "Ride", "Travel"),
        ("MAKEMYTRIP", "Flight Booking", "Travel"),
        ("INDIGO", "Flight Ticket", "Travel"),
        ("RAPIDO", "Bike Ride", "Travel"),
        ("AMAZON", "Online Purchase", "Shopping"),
        ("FLIPKART", "Order", "Shopping"),
        ("MYNTRA", "Clothes", "Shopping"),
        ("AJIO", "Fashion", "Shopping"),
        ("NETFLIX", "Subscription", "Entertainment"),
        ("SPOTIFY", "Music Premium", "Entertainment"),
        ("AMAZON PRIME", "Prime Subscription", "Entertainment"),
        ("HOTSTAR", "Streaming", "Entertainment"),
        ("APOLLO PHARMACY", "Medicine", "Healthcare"),
        ("MEDPLUS", "Pharmacy", "Healthcare"),
        ("NETMEDS", "Online Medicine", "Healthcare"),
        ("UDEMY", "Course", "Education"),
        ("BYJUS", "Learning App", "Education"),
        ("COURSERA", "Online Course", "Education"),
        ("AIRTEL", "Mobile Bill", "Utilities"),
        ("JIO RECHARGE", "Prepaid Recharge", "Utilities"),
        ("BESCOM", "Electricity Bill", "Utilities"),
        ("HDFC LOAN", "EMI Payment", "EMI"),
        ("BAJAJ FINSERV", "EMI", "EMI"),
        ("EMPLOYER PAYROLL", "Monthly Salary", "Salary"),
        ("SALARY_CREDIT", "Salary", "Salary"),
        ("ZERODHA", "Stock Purchase", "Investment"),
        ("GROWW", "Mutual Fund SIP", "Investment"),
        ("FREELANCE CLIENT", "Payment Received", "Transfer"),
        ("RENT", "Monthly Rent", "Transfer"),
        ("NEFT", "Fund Transfer", "Transfer"),
    ]
    rows = [(m, d, c) for m, d, c in samples]
    df = pd.DataFrame(rows * 60, columns=["merchant", "description", "expected_category"])
    return df


def main():
    df = load_datasets()

    if len(df) < 50:
        logger.error("Dataset too small. Need at least 50 samples.")
        sys.exit(1)

    X, y = prepare(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    logger.info(f"Train: {len(X_train)}, Test: {len(X_test)}")

    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=10000)),
        ('clf',   MultinomialNB(alpha=0.1)),
    ])

    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)

    print(classification_report(y_test, y_pred))
    logger.info(f"Accuracy: {acc:.4f} ({acc * 100:.2f}%)")

    if acc < 0.85:
        logger.warning(f"Accuracy {acc:.2%} is below 85% target. Add more training data.")
    else:
        logger.info(f"✓ Accuracy {acc:.2%} meets the 85% target.")

    joblib.dump(pipeline, PIPELINE_PATH)
    logger.info(f"Model saved to {PIPELINE_PATH}")


if __name__ == "__main__":
    main()
