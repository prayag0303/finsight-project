from fastapi import APIRouter, Depends
from app.core.dependencies import verify_internal_key
from app.models.schemas import ChatRequest, ChatResponse
from app.services.chat_service import process_chat

router = APIRouter(dependencies=[Depends(verify_internal_key)])


@router.post("", response_model=ChatResponse)
async def chat(body: ChatRequest):
    result = await process_chat(body.userId, body.message, [m.model_dump() for m in body.history])
    return ChatResponse(
        response=result["response"],
        functionCalls=result.get("functionCalls"),
    )
