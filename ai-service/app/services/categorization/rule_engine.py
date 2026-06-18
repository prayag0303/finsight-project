"""
Layer 2 — Rule Engine
Operates on the EXTRACTED merchant name (after extract_merchant() has run).
Exact match first, then partial match, then regex fallback.
"""

import re

# ─── Primary lookup table ─────────────────────────────────────────────────────
# Keys are UPPERCASE extracted merchant tokens. Values are FinSight categories.
RULES: dict[str, str] = {
    # ── Food ──────────────────────────────────────────────────────────────────
    "ZOMATO": "Food", "SWIGGY": "Food", "DOMINOS": "Food",
    "MCDONALDS": "Food", "KFC": "Food", "BURGER KING": "Food",
    "STARBUCKS": "Food", "CANTEEN": "Food", "DUNZO": "Food",
    "DOMINO": "Food", "PIZZA HUT": "Food", "PIZZAHUT": "Food",
    "MCDONALD": "Food", "BURGERKING": "Food", "SUBWAY": "Food",
    "CCD": "Food", "CHAAYOS": "Food",
    "FAASOS": "Food", "EATSURE": "Food", "BOX8": "Food",
    "HALDIRAM": "Food", "BARBEQUE NATION": "Food",

    # ── Groceries ─────────────────────────────────────────────────────────────
    "BIGBASKET": "Groceries", "BLINKIT": "Groceries", "ZEPTO": "Groceries",
    "DMART": "Groceries", "GROFERS": "Groceries", "JIOMART": "Groceries",
    "ABC MART": "Groceries", "CITY MART": "Groceries", "FAST MART": "Groceries",
    "DAILY NEEDS": "Groceries", "GREEN BASKET": "Groceries",
    "LOCAL BAZAAR": "Groceries", "VALUE STORE": "Groceries",
    "BIG BASKET": "Groceries", "D-MART": "Groceries",
    "JIO MART": "Groceries", "RELIANCE FRESH": "Groceries",
    "RELIANCE SMART": "Groceries", "SWIGGY INSTAMART": "Groceries",

    # ── Travel ────────────────────────────────────────────────────────────────
    "IRCTC": "Travel", "INDIGO": "Travel", "AIR INDIA": "Travel",
    "AIRINDIA": "Travel", "MAKEMYTRIP": "Travel", "MAKE MY TRIP": "Travel",
    "GOIBIBO": "Travel", "AGODA": "Travel", "OLA": "Travel",
    "UBER": "Travel", "RAPIDO": "Travel", "REDBUS": "Travel",
    "GOA RESORT": "Travel", "METRO": "Travel",
    "INDIAN RAILWAYS": "Travel", "YATRA": "Travel", "IXIGO": "Travel",
    "CLEARTRIP": "Travel", "EASE MY TRIP": "Travel",
    "SPICEJET": "Travel", "VISTARA": "Travel", "AKASA": "Travel",
    "OYO": "Travel", "OYO ROOMS": "Travel",
    "MAKEMYTRIP HOTEL": "Travel",

    # ── Shopping ──────────────────────────────────────────────────────────────
    "AMAZON": "Shopping", "FLIPKART": "Shopping", "MYNTRA": "Shopping",
    "AJIO": "Shopping", "NYKAA": "Shopping", "MEESHO": "Shopping",
    "TATA CLIQ": "Shopping", "TATACLIQ": "Shopping",
    "RELIANCE DIGITAL": "Shopping", "CROMA": "Shopping",
    "APPLE STORE": "Shopping", "SMART BUY": "Shopping",
    "TECH HUB": "Shopping", "URBAN SHOP": "Shopping",
    "DIGI STORE": "Shopping",
    "SNAPDEAL": "Shopping", "SHOPCLUES": "Shopping",
    "VIJAY SALES": "Shopping", "BATA": "Shopping",
    "H&M": "Shopping", "ZARA": "Shopping", "UNIQLO": "Shopping",
    "LIFESTYLE": "Shopping", "SHOPPERS STOP": "Shopping",
    "WESTSIDE": "Shopping", "PANTALOONS": "Shopping",

    # ── Entertainment ─────────────────────────────────────────────────────────
    "NETFLIX": "Entertainment", "SPOTIFY": "Entertainment",
    "AMAZON PRIME": "Entertainment", "PRIME": "Entertainment",
    "HOTSTAR": "Entertainment", "SONYLIV": "Entertainment",
    "YOUTUBE PREMIUM": "Entertainment", "GOOGLE ONE": "Entertainment",
    "MPL": "Entertainment", "DREAM11": "Entertainment",
    "POKERBAAZI": "Entertainment",
    "DISNEY": "Entertainment", "ZEEMOVIES": "Entertainment",
    "ZEE5": "Entertainment", "VOOT": "Entertainment",
    "BOOKMYSHOW": "Entertainment", "PVR": "Entertainment",
    "INOX": "Entertainment", "CINEPOLIS": "Entertainment",
    "DREAM11_WAGERING": "Entertainment", "MPL_GAMES": "Entertainment",
    "MPL GAMES": "Entertainment", "CASHOUT_GAMING": "Entertainment",
    "STEAM": "Entertainment", "APPLE MUSIC": "Entertainment",
    "GAANA": "Entertainment", "JIOSAAVN": "Entertainment",
    "JIO SAAVN": "Entertainment",

    # ── Utilities ─────────────────────────────────────────────────────────────
    "BESCOM": "Utilities", "MSEB": "Utilities", "TATA POWER": "Utilities",
    "JIO": "Utilities", "JIO RECHARGE": "Utilities", "JIO_RECHARGE": "Utilities",
    "AIRTEL": "Utilities", "VODAFONE": "Utilities",
    "ACT BROADBAND": "Utilities", "ACT FIBERNET": "Utilities",
    "ACT_BROADBAND": "Utilities", "COWORKING": "Utilities",
    "BSES": "Utilities",
    "MSEDCL": "Utilities", "TORRENT POWER": "Utilities",
    "VI": "Utilities", "BSNL": "Utilities",
    "HATHWAY": "Utilities", "EXCITEL": "Utilities",
    "TATA SKY": "Utilities", "TATAPLAY": "Utilities",
    "DISH TV": "Utilities", "DISHTV": "Utilities",
    "COWORKING_SPACE": "Utilities",

    # ── EMI ───────────────────────────────────────────────────────────────────
    "HDFC CREDIT CARD": "EMI", "HDFC LOAN": "EMI", "SBI LOAN": "EMI",
    "EMI": "EMI", "LOAN": "EMI",
    "HDFC_LOAN": "EMI", "SBI_HOME_LOAN": "EMI",
    "EMI:HDFC_LOAN": "EMI", "EMI:SBI_HOME_LOAN": "EMI",
    "BAJAJ FINSERV": "EMI", "BAJAJ FINANCE": "EMI",
    "TATA CAPITAL": "EMI", "L&T FINANCE": "EMI",
    "FULLERTON": "EMI", "MUTHOOT": "EMI",
    "ADITYA BIRLA FINANCE": "EMI", "HDB FINANCIAL": "EMI",

    # ── Salary ────────────────────────────────────────────────────────────────
    "EMPLOYER PAYROLL": "Salary", "SALARY": "Salary",
    "SALARY_CREDIT": "Salary",
    "SALARY_CREDIT_INFOSYS": "Salary", "SALARY_CREDIT_TCS": "Salary",
    "SALARY_CREDIT_WIPRO": "Salary", "SALARY_CREDIT_HCL": "Salary",
    "PAYROLL": "Salary", "WAGES": "Salary",

    # ── Investment ────────────────────────────────────────────────────────────
    "ZERODHA": "Investment", "GROWW": "Investment",
    "MUTUAL FUND SIP": "Investment", "MF DIVIDEND": "Investment",
    "SBI MUTUAL FUND": "Investment", "BANK INTEREST": "Investment",
    "WAZIRX": "Investment", "COINDCX": "Investment", "BINANCE": "Investment",
    "UPSTOX": "Investment", "ANGEL BROKING": "Investment",
    "MOTILAL OSWAL": "Investment", "HDFC SECURITIES": "Investment",
    "SBI_MUTUAL_FUND": "Investment", "CRYPTOEXCHANGEBINANCE": "Investment",
    "BINANCE_P2P": "Investment", "CRYPTOEXCHANGECOINDCX": "Investment",
    "CRYPTOEXCHANGEWAZIRX": "Investment",
    "MUTUAL FUND": "Investment", "MF SIP": "Investment",
    "FIXED DEPOSIT": "Investment", "NPS": "Investment",

    # ── Transfer ──────────────────────────────────────────────────────────────
    "FREELANCE CLIENT": "Transfer", "FREELANCE": "Transfer",
    "PARENT TRANSFER": "Transfer", "RENT": "Transfer",
    "NEFT": "Transfer", "IMPS": "Transfer",
    "PARENT_TRANSFER": "Transfer", "TRANSFER_TO_SELF_FAMILY": "Transfer",
    "MONEY_TRANSFER_CIRCULAR": "Transfer", "UNKNOWN_REMITTANCE": "Transfer",
    "FREELANCE_PROJECT": "Transfer",
    "CLIENT_PAYMENT_RAZORPAY": "Transfer", "RENT_ROOM": "Transfer",
    "FUND TRANSFER": "Transfer", "SELF TRANSFER": "Transfer",

    # ── Healthcare ────────────────────────────────────────────────────────────
    "APOLLO PHARMACY": "Healthcare", "APOLLO": "Healthcare",
    "MEDPLUS": "Healthcare", "NETMEDS": "Healthcare",
    "PHARMEASY": "Healthcare", "HEALTH PLUS": "Healthcare",
    "MEDICARE HUB": "Healthcare",
    "PRACTO": "Healthcare", "1MG": "Healthcare",
    "FORTIS": "Healthcare", "MAX HOSPITAL": "Healthcare",
    "MEDANTA": "Healthcare",

    # ── Education ─────────────────────────────────────────────────────────────
    "COURSERA": "Education", "UDEMY": "Education",
    "UNACADEMY": "Education", "BYJUS": "Education",
    "BOOK POINT": "Education", "BOOKS STORE": "Education",
    "LEARN LAB": "Education",
    "BYJU": "Education", "VEDANTU": "Education",
    "UPGRAD": "Education", "SCALER": "Education",
    "PHYSICSWALLAH": "Education", "PW APP": "Education",

    # ── Others ────────────────────────────────────────────────────────────────
    "ATM": "Others", "CASH_WITHDRAWAL": "Others",
    "QUICK_LOAN_APP": "Others", "LOAN_FROM_FRIEND": "Others",
    "ADOBE": "Others", "AWS": "Others",
}

# ─── Regex fallback for patterns not in the RULES dict ───────────────────────
_REGEX_RULES: list[tuple[re.Pattern, str, float]] = []


def _rx(pattern: str, category: str, confidence: float = 0.95):
    _REGEX_RULES.append((re.compile(pattern, re.IGNORECASE), category, confidence))


_rx(r'\b(SALARY|PAYROLL|PAY CREDIT|WAGES|STIPEND)\b', 'Salary')
_rx(r'\b(EMI|LOAN\s+EMI|HOME\s+LOAN|CAR\s+LOAN|PERSONAL\s+LOAN)\b', 'EMI')
_rx(r'\b(NACH\s+DEBIT|ECS\s+DEBIT)\b', 'EMI', 0.80)
_rx(r'\b(MUTUAL\s+FUND|SIP\s+DEBIT|FIXED\s+DEPOSIT|RECURRING\s+DEPOSIT)\b', 'Investment')
_rx(r'\b(ZERODHA|GROWW|UPSTOX|NSE|BSE|IPO)\b', 'Investment')
_rx(r'\b(ZOMATO|SWIGGY|BLINKIT|DUNZO|ZEPTO)\b', 'Food')
_rx(r'\b(RESTAURANT|DHABA|CANTEEN|CAFE|COFFEE)\b', 'Food', 0.85)
_rx(r'\b(BIGBASKET|JIOMART|DMART|GROFERS|GROCERY)\b', 'Groceries')
_rx(r'\b(IRCTC|MAKEMYTRIP|UBER|OLA|RAPIDO|INDIGO|AIRASIA)\b', 'Travel')
_rx(r'\b(HOTEL|FLIGHT|AIRLINE|RAILWAY|METRO)\b', 'Travel', 0.85)
_rx(r'\b(AMAZON|FLIPKART|MYNTRA|MEESHO|NYKAA)\b', 'Shopping')
_rx(r'\b(MALL|SUPERSTORE|RETAIL)\b', 'Shopping', 0.80)
_rx(r'\b(NETFLIX|SPOTIFY|HOTSTAR|PRIME|ZEE|SONY)\b', 'Entertainment')
_rx(r'\b(CINEMA|MOVIE|OTT|STREAMING|GAMING|GAME)\b', 'Entertainment', 0.80)
_rx(r'\b(BESCOM|AIRTEL|JIO|VODAFONE|BSNL|ELECTRICITY|BROADBAND)\b', 'Utilities')
_rx(r'\b(RECHARGE|BILL\s+PAYMENT|POSTPAID|PREPAID)\b', 'Utilities', 0.85)
_rx(r'\b(APOLLO|MEDPLUS|PHARMEASY|HOSPITAL|PHARMACY|CLINIC|DOCTOR)\b', 'Healthcare')
_rx(r'\b(BYJU|UNACADEMY|UDEMY|COURSERA|SCHOOL\s+FEE|COLLEGE\s+FEE)\b', 'Education')
_rx(r'\b(FUND\s+TRANSFER|SELF\s+TRANSFER)\b', 'Transfer', 0.80)


def apply_rules(merchant: str) -> dict | None:
    """
    Match extracted merchant name against rules.
    Called with the output of extract_merchant(), not the raw description.
    Returns {category, confidence, source} or None.
    """
    m = merchant.upper().strip().replace('_', ' ')
    if not m:
        return None

    # Tier 1: exact match
    if m in RULES:
        return {"category": RULES[m], "confidence": 0.98, "source": "RULE_ENGINE"}

    # Tier 2: partial match — keyword is contained within merchant or vice versa
    for keyword, category in RULES.items():
        if keyword in m or m in keyword:
            return {"category": category, "confidence": 0.95, "source": "RULE_ENGINE"}

    # Tier 3: regex fallback — broader pattern matching
    for pattern, category, confidence in _REGEX_RULES:
        if pattern.search(m):
            return {"category": category, "confidence": confidence, "source": "RULE_ENGINE"}

    return None
