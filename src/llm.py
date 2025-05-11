import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

def get_response_from_llm(prompt: str, model="gpt-4o") -> tuple:
    try:
        print("📤 Final Prompt to LLM:\n" + "-"*60)
        print(prompt)
        print("-"*60 + "\n")

        response = client.chat.completions.create(
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
        return response.choices[0].message.content, prompt
    except Exception as e:
        raise RuntimeError(f"❌ OpenAI API error: {str(e)}")

def get_response_from_llm_from_messages(messages, model="gpt-4o") -> tuple:
    try:
        response = client.chat.completions.create(
            model=model,
            temperature=0.0,
            messages=messages
        )
        return response.choices[0].message.content, messages
    except Exception as e:
        raise RuntimeError(f"❌ OpenAI API error: {str(e)}")
