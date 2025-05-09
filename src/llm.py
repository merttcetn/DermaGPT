import os
import openai
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY not found in .env")

openai.api_key = OPENAI_API_KEY

def get_response_from_llm(prompt: str, model="gpt-4o") -> str:
    """
    Sends prompt to OpenAI and returns the model response.
    Temperature is set to 0.0 for deterministic output.
    """
    try:
        response = openai.ChatCompletion.create(
            model=model,
            temperature=0.0,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert dermatologist assistant giving personalized skincare advice."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        return response["choices"][0]["message"]["content"]
    except Exception as e:
        raise RuntimeError(f"❌ OpenAI API error: {str(e)}")
