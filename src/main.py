from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uuid

from src.session_memory import chat_sessions
from src.face_api import get_wrinkle_acne_scores
from src.prompt import convert_quiz_to_text
from src.llm import get_response_from_llm

app = FastAPI()
# http://127.0.0.1:8000/docs (swagger docs)

class StartSessionRequest(BaseModel):
    photo_url: str
    quiz_data: dict

class StartSessionResponse(BaseModel):
    session_id: str
    initial_response: str

class ChatRequest(BaseModel):
    session_id: str
    user_message: str

class ChatResponse(BaseModel):
    bot_response: str

@app.post("/start_session", response_model=StartSessionResponse)
def start_session(request: StartSessionRequest):
    session_id = str(uuid.uuid4())
    photo_url = request.photo_url
    quiz_data = request.quiz_data

    try:
        wrinkle_data, acne_data, wrinkle_score, acne_score = get_wrinkle_acne_scores(photo_url, quiz_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face analysis failed: {str(e)}")

    quiz_summary = convert_quiz_to_text(quiz_data, wrinkle_data, acne_data, wrinkle_score, acne_score)

    try:
        response = get_response_from_llm(quiz_summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {str(e)}")

    chat_sessions[session_id] = {
        "photo_url": photo_url,
        "quiz_data": quiz_data,
        "history": [
            {"user": "Initial quiz", "bot": response}
        ]
    }

    return StartSessionResponse(
        session_id=session_id,
        initial_response=response
    )

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    session_id = request.session_id
    user_msg = request.user_message

    if session_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="Session not found.")

    history = chat_sessions[session_id]["history"]

    messages = [
        {"role": "system", "content": "You are a helpful skincare assistant based on previous quiz and advice."}
    ]
    for turn in history:
        messages.append({"role": "user", "content": turn["user"]})
        messages.append({"role": "assistant", "content": turn["bot"]})

    messages.append({"role": "user", "content": user_msg})

    try:
        response = get_response_from_llm_from_messages(messages)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

    chat_sessions[session_id]["history"].append({
        "user": user_msg,
        "bot": response
    })

    return ChatResponse(bot_response=response)
