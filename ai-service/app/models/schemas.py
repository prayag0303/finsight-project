from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import date, datetime


# ─── Categorization ───────────────────────────────────────────────

class TransactionInput(BaseModel):
    description: str
    merchant: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[str] = None
    # Pre-resolved from merchant_learning (passed by backend)
    merchant_category: Optional[str] = None


class BatchCategorizationRequest(BaseModel):
    transactions: list[TransactionInput]


class CategorizationResult(BaseModel):
    category: str
    confidence: float
    source: str   # MERCHANT_LEARNING | RULE_ENGINE | ML_CLASSIFIER | GEMINI | FALLBACK
    layer: int = 5  # 1=MerchantLearning 2=RuleEngine 3=ML 4=Gemini 5=Fallback


class BatchCategorizationResponse(BaseModel):
    results: list[CategorizationResult]


# ─── Chat ─────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # USER | ASSISTANT
    content: str


class ChatRequest(BaseModel):
    userId: str
    message: str
    history: list[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    response: str
    functionCalls: Optional[list[dict]] = None


# ─── Monthly Insights ─────────────────────────────────────────────

class InsightRequest(BaseModel):
    userId: str
    month: str
    summary: dict
    categoryBreakdown: list[dict]
    budgets: list[dict]
    subscriptions: list[dict]
    fraudAlerts: list[dict]


class InsightResponse(BaseModel):
    insights: str
    highlights: list[str] = Field(default_factory=list)


# ─── Anomaly Detection ────────────────────────────────────────────

class TransactionForAnomaly(BaseModel):
    id: str
    amount: float
    merchant: Optional[str] = None
    date: Any  # date string or date object
    type: str
    createdAt: Any


class UserStats(BaseModel):
    avgAmount: float


class AnomalyRequest(BaseModel):
    userId: str
    transactions: list[TransactionForAnomaly]
    userStats: UserStats


class AnomalyAlert(BaseModel):
    transactionId: str
    alertType: str  # DUPLICATE | LARGE_TRANSACTION | SPENDING_SPIKE
    description: str


class AnomalyResponse(BaseModel):
    anomalies: list[AnomalyAlert]


# ─── Subscription Detection ───────────────────────────────────────

class TransactionForSubscription(BaseModel):
    id: str
    merchant: Optional[str] = None
    amount: float
    date: Any
    description: str


class SubscriptionRequest(BaseModel):
    userId: str
    transactions: list[TransactionForSubscription]


class DetectedSubscription(BaseModel):
    merchant: str
    averageAmount: float
    frequency: str
    lastCharged: str
    nextExpected: Optional[str] = None
    transactionCount: int
    category: str = "Others"


class SubscriptionResponse(BaseModel):
    subscriptions: list[DetectedSubscription]


# ─── Savings Opportunities ────────────────────────────────────────

class SavingsRequest(BaseModel):
    userId: str
    summary: dict
    categoryBreakdown: list[dict]
    subscriptions: list[dict]


class SavingsOpportunity(BaseModel):
    title: str
    description: str
    potentialSaving: float
    category: str
    priority: str  # HIGH | MEDIUM | LOW


class SavingsResponse(BaseModel):
    opportunities: list[SavingsOpportunity]
    totalPotentialSaving: float
