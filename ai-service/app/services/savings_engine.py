"""
Savings Opportunity Engine

Rule-based engine that analyses spending patterns and generates
personalised saving recommendations with quantified impact.
"""

import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


def _category_total(breakdown: list[dict], category: str) -> float:
    for item in breakdown:
        if item.get("category") == category:
            return float(item.get("total", 0))
    return 0.0


def _format_inr(amount: float) -> str:
    return f"₹{amount:,.0f}"


def generate_opportunities(
    summary: dict,
    category_breakdown: list[dict],
    subscriptions: list[dict],
) -> list[dict]:
    opportunities = []

    total_income = float(summary.get("totalIncome", 0))
    total_expenses = float(summary.get("totalExpenses", 0))

    # ─── Rule 1: High food delivery spend ────────────────────────────
    food_total = _category_total(category_breakdown, "Food")
    if food_total > settings.SAVINGS_FOOD_DELIVERY_THRESHOLD:
        saving = round(food_total * 0.20, 2)
        opportunities.append({
            "title": "Reduce Food Delivery",
            "description": (
                f"You spent {_format_inr(food_total)} on food this month. "
                f"Cooking at home 2 extra days per week could save you {_format_inr(saving)}/month."
            ),
            "potentialSaving": saving,
            "category": "Food",
            "priority": "HIGH" if food_total > 8000 else "MEDIUM",
        })

    # ─── Rule 2: High entertainment spend ────────────────────────────
    entertainment_total = _category_total(category_breakdown, "Entertainment")
    if entertainment_total > settings.SAVINGS_ENTERTAINMENT_THRESHOLD:
        saving = round(entertainment_total * 0.30, 2)
        opportunities.append({
            "title": "Optimise Entertainment Subscriptions",
            "description": (
                f"Entertainment spending is {_format_inr(entertainment_total)}/month. "
                f"Review and cancel unused streaming services to save {_format_inr(saving)}/month."
            ),
            "potentialSaving": saving,
            "category": "Entertainment",
            "priority": "MEDIUM",
        })

    # ─── Rule 3: Many active subscriptions ───────────────────────────
    active_subs = [s for s in subscriptions if s.get("isActive", True)]
    if len(active_subs) >= 4:
        total_sub_spend = sum(float(s.get("averageAmount", 0)) for s in active_subs)
        saving = round(total_sub_spend * 0.25, 2)
        opportunities.append({
            "title": "Audit Your Subscriptions",
            "description": (
                f"You have {len(active_subs)} active subscriptions costing "
                f"{_format_inr(total_sub_spend)}/month. "
                f"Cancelling even 1-2 unused services could save {_format_inr(saving)}/month."
            ),
            "potentialSaving": saving,
            "category": "Entertainment",
            "priority": "HIGH" if len(active_subs) >= 6 else "MEDIUM",
        })

    # ─── Rule 4: High EMI ratio ───────────────────────────────────────
    emi_total = _category_total(category_breakdown, "EMI")
    if total_income > 0:
        emi_ratio = emi_total / total_income
        if emi_ratio > settings.SAVINGS_HIGH_EMI_RATIO:
            saving = round(emi_total * 0.10, 2)
            opportunities.append({
                "title": "Reduce EMI Burden",
                "description": (
                    f"EMIs are consuming {emi_ratio * 100:.0f}% of your income "
                    f"({_format_inr(emi_total)}/month). "
                    f"Consider prepaying high-interest loans to save {_format_inr(saving)}/month in interest."
                ),
                "potentialSaving": saving,
                "category": "EMI",
                "priority": "HIGH",
            })

    # ─── Rule 5: High shopping spike ─────────────────────────────────
    shopping_total = _category_total(category_breakdown, "Shopping")
    if shopping_total > 10000:
        saving = round(shopping_total * 0.20, 2)
        opportunities.append({
            "title": "Set a Shopping Budget",
            "description": (
                f"Shopping spend of {_format_inr(shopping_total)} this month is high. "
                f"Creating a monthly shopping budget could help you save {_format_inr(saving)}/month."
            ),
            "potentialSaving": saving,
            "category": "Shopping",
            "priority": "MEDIUM",
        })

    # ─── Rule 6: Low savings rate ─────────────────────────────────────
    if total_income > 0:
        savings_rate = float(summary.get("savings", 0)) / total_income
        if savings_rate < 0.20 and total_income > 0:
            target_saving = round(total_income * 0.20 - float(summary.get("savings", 0)), 2)
            if target_saving > 0:
                opportunities.append({
                    "title": "Boost Your Savings Rate",
                    "description": (
                        f"Your current savings rate is {savings_rate * 100:.0f}%. "
                        f"Financial advisors recommend saving 20% of income. "
                        f"Try to save an additional {_format_inr(target_saving)}/month."
                    ),
                    "potentialSaving": target_saving,
                    "category": "Others",
                    "priority": "HIGH" if savings_rate < 0.10 else "MEDIUM",
                })

    # ─── Rule 7: No investment detected ──────────────────────────────
    investment_total = _category_total(category_breakdown, "Investment")
    if investment_total == 0 and total_income > 15000:
        suggested_sip = round(total_income * 0.10, 2)
        opportunities.append({
            "title": "Start a Monthly SIP",
            "description": (
                f"No investments detected this month. "
                f"Starting a SIP of {_format_inr(suggested_sip)}/month (10% of income) "
                f"can significantly grow your wealth over time."
            ),
            "potentialSaving": suggested_sip,
            "category": "Investment",
            "priority": "MEDIUM",
        })

    # ─── Rule 8: High travel/cab spend ───────────────────────────────
    travel_total = _category_total(category_breakdown, "Travel")
    if travel_total > 5000:
        saving = round(travel_total * 0.25, 2)
        opportunities.append({
            "title": "Reduce Cab Expenses",
            "description": (
                f"Travel spending is {_format_inr(travel_total)}/month. "
                f"Using metro or carpooling could save up to {_format_inr(saving)}/month."
            ),
            "potentialSaving": saving,
            "category": "Travel",
            "priority": "LOW",
        })

    # Sort by potential saving descending
    opportunities.sort(key=lambda x: x["potentialSaving"], reverse=True)
    total = sum(o["potentialSaving"] for o in opportunities)

    logger.info(f"Savings engine: {len(opportunities)} opportunities, total ₹{total:.0f}/month")
    return opportunities, round(total, 2)
