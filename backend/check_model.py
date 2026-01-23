import os
from google import genai
from dotenv import load_dotenv

load_dotenv(".env.local")

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

print("Fetching available models...")
print("-" * 30)

try:
    # Just print the name of every model found
    for m in client.models.list():
        print(f"Found: {m.name}")
except Exception as e:
    print(f"Error: {e}")