import re

# ─── Step 0 ───────────────────────────────────────────────────────────────────
# Must run on EVERY description before any classification layer.
# Strips bank-specific transaction prefixes that mask the actual merchant name.

_MERCHANT_PREFIXES = [
    r'^UPI:\d+:',        # UPI:239401923:ZOMATO  → ZOMATO
    r'^UPI:\d+-',        # UPI:239401923-ZOMATO  → ZOMATO
    r'^UPI:',            # UPI:ZOMATO            → ZOMATO
    r'^PCA:\d+:\d+:',
    r'^IMPS/P2P/',
    r'^IMPS/P2A/',
    r'^NETTXN:',
    r'^FUNDS_TRANSFER/',
    r'^NEFT:',
    r'^REFUNDOF:',
    r'^SALARY_CREDIT_',
]

def extract_merchant(description: str) -> str:
    """
    Strip bank-specific prefixes that mask the actual merchant name.
    Must be called on every description before any pipeline layer.
    """
    if not description:
        return ""
    desc = description.upper().strip()
    for prefix in _MERCHANT_PREFIXES:
        new_desc = re.sub(prefix, '', desc)
        if new_desc != desc:
            desc = new_desc.strip()
            break  # one prefix stripped is enough
    return desc.strip()


# ─── Existing helpers (kept for ML training compatibility) ────────────────────

# Prefixes that carry no categorization signal
_STRIP_PREFIXES = re.compile(
    r'^(UPI[\/\-]|NEFT[\/\-]|IMPS[\/\-]|RTGS[\/\-]|POS[\/\-]|ATM[\/\-]|'
    r'NACH[\/\-]|ACH[\/\-]|BY\s+|TO\s+|FROM\s+|DR\s+|CR\s+)',
    re.IGNORECASE,
)

# Reference numbers: 8+ digit sequences, alphanumeric IDs
_STRIP_REFS = re.compile(r'\b\d{6,}\b|\b[A-Z]{2,}\d{6,}\b|\b\d+[A-Z]+\d+\b')

# Characters that are only noise
_STRIP_NOISE = re.compile(r'[^A-Z0-9\s]')


def clean_text(text: str) -> str:
    """Normalise a raw bank transaction description for classification."""
    if not text:
        return ""
    t = text.upper().strip()
    t = _STRIP_PREFIXES.sub("", t).strip()
    t = _STRIP_REFS.sub(" ", t)
    t = _STRIP_NOISE.sub(" ", t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t


def extract_merchant_tokens(description: str, merchant: str | None = None) -> str:
    """
    Return a cleaned, combined string suitable for TF-IDF.
    Merchant name (if present) is weighted by repeating it.
    """
    cleaned_desc = clean_text(description)
    if merchant:
        cleaned_merchant = clean_text(merchant)
        # Repeat merchant to give it more weight in TF-IDF
        return f"{cleaned_merchant} {cleaned_merchant} {cleaned_desc}"
    return cleaned_desc


def normalize_merchant(merchant: str | None) -> str | None:
    """Uppercase + strip a merchant name for dictionary lookups."""
    if not merchant:
        return None
    return clean_text(merchant).strip() or None
