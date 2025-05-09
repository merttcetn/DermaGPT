import os
import requests
from dotenv import load_dotenv

load_dotenv()

FACE_API_URL = os.getenv("FACE_ANALYSIS_API_URL")

if not FACE_API_URL:
    raise RuntimeError("FACE_ANALYSIS_API_URL not found in .env")

def get_wrinkle_acne_scores(photo_url: str, quiz_data: dict):
    payload = {
        "data": {
            "user_id": "test_user_123",
            "Photo_url": photo_url,
            "quiz_data": quiz_data
        }
    }

    print("📤 FACE API PAYLOAD:", payload)  # debug için

    try:
        response = requests.post(FACE_API_URL, json=payload)
        response.raise_for_status()
    except Exception as e:
        print("❌ Face API error response:", response.text if 'response' in locals() else str(e))
        raise RuntimeError(f"❌ Face analysis API call failed: {str(e)}")

    result = response.json()
    return (
        result.get("wrinkle_data", []),
        result.get("acne_data", []),
        result.get("wrinkle_score", 0.0),
        result.get("acne_score", 0.0)
    )
