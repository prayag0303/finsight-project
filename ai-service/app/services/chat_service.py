"""
AI Finance Chatbot with Gemini Function Calling

Architecture:
  1. User message → FastAPI → Gemini (with 7 function declarations)
  2. Gemini issues function_call → FastAPI calls backend internal API
  3. Backend returns structured data → FastAPI feeds result back to Gemini
  4. Gemini generates final text response
  5. Response returned to Express backend → stored in chat_history

Gemini NEVER accesses the database. All data goes through backend APIs.
"""

import json
import logging
from datetime import datetime

import httpx
import google.generativeai as genai
from google.generativeai import protos

from app.core.config import settings
from app.utils.gemini_client import get_chat_model

logger = logging.getLogger(__name__)

# ─── Function declarations for Gemini ─────────────────────────────

FUNCTION_DECLARATIONS = [
    protos.FunctionDeclaration(
        name="get_category_total",
        description="Get total spending and transaction count for a specific category in a given month.",
        parameters=protos.Schema(
            type=protos.Type.OBJECT,
            properties={
                "category": protos.Schema(
                    type=protos.Type.STRING,
                    description="Category name: Food, Groceries, Travel, Shopping, Entertainment, Healthcare, Education, Utilities, EMI, Salary, Investment, Transfer, Others",
                ),
                "month": protos.Schema(
                    type=protos.Type.STRING,
                    description="Month in YYYY-MM format. Defaults to current month if not specified.",
                ),
            },
            required=["category"],
        ),
    ),
    protos.FunctionDeclaration(
        name="get_monthly_summary",
        description="Get overall financial summary: total income, expenses, savings, and top category.",
        parameters=protos.Schema(
            type=protos.Type.OBJECT,
            properties={
                "month": protos.Schema(
                    type=protos.Type.STRING,
                    description="Month in YYYY-MM format. Defaults to current month.",
                ),
            },
        ),
    ),
    protos.FunctionDeclaration(
        name="get_top_category",
        description="Get the highest spending category and full category breakdown for a month.",
        parameters=protos.Schema(
            type=protos.Type.OBJECT,
            properties={
                "month": protos.Schema(
                    type=protos.Type.STRING,
                    description="Month in YYYY-MM format.",
                ),
            },
        ),
    ),
    protos.FunctionDeclaration(
        name="get_budget_status",
        description="Get all budget limits with actual spending, remaining amounts, and usage percentages.",
        parameters=protos.Schema(
            type=protos.Type.OBJECT,
            properties={
                "month": protos.Schema(
                    type=protos.Type.STRING,
                    description="Month in YYYY-MM format.",
                ),
            },
        ),
    ),
    protos.FunctionDeclaration(
        name="get_subscription_list",
        description="Get list of all active recurring subscriptions and their monthly costs.",
        parameters=protos.Schema(
            type=protos.Type.OBJECT,
            properties={},
        ),
    ),
    protos.FunctionDeclaration(
        name="get_anomalies",
        description="Get recent fraud alerts and anomalous transactions flagged by the system.",
        parameters=protos.Schema(
            type=protos.Type.OBJECT,
            properties={},
        ),
    ),
    protos.FunctionDeclaration(
        name="get_spending_trend",
        description="Get monthly spending and income trends for the past N months.",
        parameters=protos.Schema(
            type=protos.Type.OBJECT,
            properties={
                "months": protos.Schema(
                    type=protos.Type.INTEGER,
                    description="Number of months of history to return (default 6).",
                ),
            },
        ),
    ),
]

TOOLS = [protos.Tool(function_declarations=FUNCTION_DECLARATIONS)]


# ─── Backend API caller ────────────────────────────────────────────

async def _call_backend(
    endpoint: str,
    params: dict,
    user_id: str,
) -> dict:
    """Call backend internal API to fetch financial data for Gemini."""
    url = f"{settings.BACKEND_URL}/internal/{endpoint}"
    params["userId"] = user_id

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                url,
                params=params,
                headers={"X-Internal-Key": settings.INTERNAL_API_KEY},
            )
            resp.raise_for_status()
            return resp.json().get("data", {})
    except Exception as e:
        logger.warning(f"Backend call failed ({endpoint}): {e}")
        return {"error": f"Could not retrieve {endpoint} data"}


async def _execute_function(fn_name: str, fn_args: dict, user_id: str) -> dict:
    """Dispatch Gemini function call to the correct backend endpoint."""
    endpoint_map = {
        "get_category_total": "category-total",
        "get_monthly_summary": "monthly-summary",
        "get_top_category": "top-category",
        "get_budget_status": "budget-status",
        "get_subscription_list": "subscription-list",
        "get_anomalies": "anomalies",
        "get_spending_trend": "spending-trend",
    }
    endpoint = endpoint_map.get(fn_name)
    if not endpoint:
        return {"error": f"Unknown function: {fn_name}"}
    return await _call_backend(endpoint, dict(fn_args), user_id)


# ─── System prompt ─────────────────────────────────────────────────

def _system_prompt(user_id: str) -> str:
    return (
        f"You are FinSight AI, a personal finance assistant. "
        f"Today is {datetime.now().strftime('%B %d, %Y')}. "
        f"You help users understand their Indian Rupee (₹) spending, budgets, subscriptions, "
        f"anomalies, and savings. Always call a function to get real data before answering "
        f"financial questions. Never guess numbers — use the functions. "
        f"Be concise, specific, and warm. Format currency as ₹X,XXX."
    )


# ─── Main chat handler ─────────────────────────────────────────────

async def process_chat(
    user_id: str,
    message: str,
    history: list[dict],
) -> dict:
    """
    Process a user chat message with Gemini function calling.
    Returns {response: str, functionCalls: list}.
    """
    model = get_chat_model(tools=TOOLS)

    # Build conversation history for Gemini
    gemini_history = []
    for msg in history[-10:]:  # Last 10 messages for context
        role = "user" if msg.get("role", "").upper() == "USER" else "model"
        gemini_history.append({"role": role, "parts": [{"text": msg.get("content", "")}]})

    chat = model.start_chat(history=gemini_history)

    # Prepend system context to first message
    full_message = f"{_system_prompt(user_id)}\n\nUser question: {message}"

    function_calls_log = []
    MAX_ROUNDS = 5  # prevent infinite function-calling loops

    try:
        response = chat.send_message(full_message)

        for _ in range(MAX_ROUNDS):
            # Check if Gemini wants to call a function
            fn_call = None
            for part in response.candidates[0].content.parts:
                if hasattr(part, "function_call") and part.function_call.name:
                    fn_call = part.function_call
                    break

            if fn_call is None:
                break  # No more function calls — extract final text

            # Execute the function
            fn_args = {k: v for k, v in fn_call.args.items()}
            logger.info(f"Gemini called: {fn_call.name}({fn_args})")
            result = await _execute_function(fn_call.name, fn_args, user_id)
            function_calls_log.append({
                "name": fn_call.name,
                "args": fn_args,
                "result": result,
            })

            # Feed result back to Gemini
            response = chat.send_message(
                protos.Content(
                    parts=[
                        protos.Part(
                            function_response=protos.FunctionResponse(
                                name=fn_call.name,
                                response={"result": json.dumps(result, default=str)},
                            )
                        )
                    ]
                )
            )

        # Extract final text response
        final_text = ""
        for part in response.candidates[0].content.parts:
            if hasattr(part, "text") and part.text:
                final_text += part.text

        return {
            "response": final_text or "I couldn't process your request right now. Please try again.",
            "functionCalls": function_calls_log,
        }

    except Exception as e:
        logger.error(f"Chat processing failed: {e}")
        return {
            "response": (
                "I'm having trouble connecting to your financial data right now. "
                "Please try again in a moment."
            ),
            "functionCalls": [],
        }
