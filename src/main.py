from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uuid

from src.session_memory import chat_sessions
from src.face_api import get_wrinkle_acne_scores
from src.prompt import convert_quiz_to_text
from src.llm import get_response_from_llm

app = FastAPI()

# --- Request schema ---
class StartSessionRequest(BaseModel):
    photo_url: str
    quiz_data: dict

# --- Response schema ---
class StartSessionResponse(BaseModel):
    session_id: str
    initial_response: str

@app.post("/start_session", response_model=StartSessionResponse)
def start_session(request: StartSessionRequest):
    session_id = str(uuid.uuid4())

    photo_url = request.photo_url
    quiz_data = request.quiz_data

    # Step 1: Face analysis API call
    try:
        wrinkle_data, acne_data, wrinkle_score, acne_score = get_wrinkle_acne_scores(photo_url, quiz_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face analysis failed: {str(e)}")

    # Step 2: Quiz + image summary prompt
    quiz_summary = convert_quiz_to_text(quiz_data, wrinkle_data, acne_data, wrinkle_score, acne_score)

    # Step 3: LLM recommendation
    try:
        response = get_response_from_llm(quiz_summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {str(e)}")

    # Step 4: Save to memory
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
