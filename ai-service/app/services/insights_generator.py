"""
Monthly AI Insights Generator

Uses Gemini to produce a personalised, narrative financial report
from aggregated transaction data.
"""

import logging
import json

from app.utils.gemini_client import get_generative_model
import google.generativeai as genai

logger = logging.getLogger(__name__)


def _build_prompt(month: str, data: dict) -> str:
    summary = data.get("summary", {})
    category_breakdown = data.get("categoryBreakdown", [])
    budgets = data.get("budgets", [])
    subscriptions = data.get("subscriptions", [])
    fraud_alerts = data.get("fraudAlerts", [])

    top_categories = category_breakdown[:5]
    over_budget = [b for b in budgets if b.get("isOverBudget") or b.get("usagePercent", 0) > 90]
    active_subs_cost = sum(float(s.get("averageAmount", 0)) for s in subscriptions if s.get("isActive", True))

    return f"""You are FinSight, an AI financial advisor. Generate a concise, personalised monthly financial insights report.

Financial Data for {month}:
- Total Income: ₹{summary.get('totalIncome', 0):,.0f}
- Total Expenses: ₹{summary.get('totalExpenses', 0):,.0f}
- Savings: ₹{summary.get('savings', 0):,.0f}
- Month-over-Month Expense Change: {summary.get('momExpenseChange', 'N/A')}%
- Top Category: {summary.get('topCategory', 'N/A')}

Top Spending Categories:
{json.dumps(top_categories, indent=2)}

Budget Alerts (over 90% used or exceeded):
{json.dumps(over_budget, indent=2) if over_budget else "None"}

Active Subscriptions: {len(subscriptions)} subscriptions costing ₹{active_subs_cost:,.0f}/month

Fraud/Anomaly Alerts: {len(fraud_alerts)} unresolved alerts

Instructions:
1. Write 3-4 sentences of narrative insight (specific numbers, not generic advice)
2. Highlight the most important positive and concerning trends
3. Give 2-3 specific, actionable recommendations
4. Mention savings rate and whether it's healthy (20%+ target)
5. Keep it conversational and encouraging
6. Use ₹ for all amounts
7. Format as plain text (no markdown headers, no bullet points)

Return ONLY a JSON object with this structure:
{{
  "insights": "3-4 sentence narrative paragraph here",
  "highlights": ["highlight 1", "highlight 2", "highlight 3"]
}}"""


def generate_monthly_insights(month: str, data: dict) -> dict:
    """Generate AI monthly insights. Returns dict with 'insights' and 'highlights'."""
    try:
        model = get_generative_model()
        prompt = _build_prompt(month, data)

        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.4,
                response_mime_type="application/json",
            ),
        )

        raw = response.text.strip()
        if raw.startswith("```"):
            import re
            raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()

        result = json.loads(raw)
        return {
            "insights": result.get("insights", ""),
            "highlights": result.get("highlights", []),
        }

    except Exception as e:
        logger.warning(f"Insights generation failed: {e}")
        summary = data.get("summary", {})
        income = float(summary.get("totalIncome", 0))
        expenses = float(summary.get("totalExpenses", 0))
        savings = float(summary.get("savings", 0))
        savings_rate = (savings / income * 100) if income > 0 else 0

        return {
            "insights": (
                f"In {month}, you earned ₹{income:,.0f} and spent ₹{expenses:,.0f}, "
                f"saving ₹{savings:,.0f} ({savings_rate:.0f}% savings rate). "
                f"Your top spending category was {summary.get('topCategory', 'Others')}."
            ),
            "highlights": [
                f"Savings: ₹{savings:,.0f} ({savings_rate:.0f}%)",
                f"Top category: {summary.get('topCategory', 'N/A')}",
            ],
        }
