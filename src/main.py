from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uuid

from src.session_memory import chat_sessions
from src.face_api import get_wrinkle_acne_scores
from src.prompt import convert_quiz_to_text, build_full_prompt
from src.vectorstore import get_top_k_matches
from src.llm import get_response_from_llm

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],
)


# --- Request / Response Schemas ---
class StartSessionRequest(BaseModel):
    photo_url: Optional[str] = None
    quiz_data: dict

class StartSessionResponse(BaseModel):
    session_id: str

class ChatRequest(BaseModel):
    session_id: str
    user_message: str

class ChatResponse(BaseModel):
    bot_response: str

# --- Start Session (quiz only, no LLM) ---
@app.post("/start_session", response_model=StartSessionResponse)
def start_session(request: StartSessionRequest):
    session_id = str(uuid.uuid4())
    photo_url = request.photo_url
    quiz_data = request.quiz_data

    if photo_url:
        try:
            wrinkle_data, acne_data, wrinkle_score, acne_score = get_wrinkle_acne_scores(photo_url, quiz_data)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Face analysis failed: {str(e)}")
    else:
        wrinkle_data, acne_data, wrinkle_score, acne_score = [], [], None, None

    quiz_summary = convert_quiz_to_text(quiz_data, wrinkle_data, acne_data, wrinkle_score, acne_score)

    chat_sessions[session_id] = {
        "photo_url": photo_url,
        "quiz_data": quiz_data,
        "quiz_summary": quiz_summary,
        "history": []  # Başlangıçta boş olacak
    }

    return StartSessionResponse(session_id=session_id)

# --- Chat Endpoint (uses quiz + Pinecone + chat history) ---
@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    session_id = request.session_id
    user_msg = request.user_message

    if session_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="Session not found.")

    session = chat_sessions[session_id]
    quiz_summary = session["quiz_summary"]
    history = session["history"]

    # --- Retrieve QA from Pinecone ---
    try:
        context_snippets = get_top_k_matches(user_msg)
    except Exception as e:
        context_snippets = []
        print(f"⚠️ Pinecone retrieval failed: {e}")

    # --- Build Prompt ---
    prompt = build_full_prompt(
        quiz_text=quiz_summary,
        context_snippets=context_snippets,
        user_question=user_msg
    )

    # --- LLM Call ---
    try:
        response = get_response_from_llm(prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {str(e)}")

    # --- Update History ---
    history.append({
        "user": user_msg,
        "bot": response
    })

    return ChatResponse(bot_response=response)
