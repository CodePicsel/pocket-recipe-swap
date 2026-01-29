#!/usr/bin/env python3

import os
import sys
import argparse
import time
import json
from typing import List, Optional, Dict, Any

from dotenv import load_dotenv
from google import genai
from supabase import create_client

# =========================
# ENV / CONFIG
# =========================
load_dotenv(".env.local")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_ID = os.getenv("MODEL_ID", "gemini-2.5-flash")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # service_role recommended for server use

LOCK_KEY = "recipe_generation"

if not GEMINI_API_KEY:
    print("ERROR: GEMINI_API_KEY not set in .env.local", file=sys.stderr)
    sys.exit(1)

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: SUPABASE_URL and SUPABASE_KEY must be set in .env.local", file=sys.stderr)
    sys.exit(1)

# =========================
# CLIENTS
# =========================
ai_client = genai.Client(api_key=GEMINI_API_KEY)
sb = create_client(SUPABASE_URL, SUPABASE_KEY)

# =========================
# DB LOCK SYSTEM
# =========================
def acquire_lock(lock_key: str = LOCK_KEY, owner: Optional[str] = None, wait: int = 5) -> bool:
    """
    Acquire a cross-process lock using a DB row insert.
    Returns True if acquired, False otherwise.
    """
    owner = owner or f"pid:{os.getpid()}"
    deadline = time.time() + wait

    while True:
        try:
            sb.table("locks").insert({
                "key": lock_key,
                "owner": owner
            }).execute()
            return True
        except Exception:
            # Likely duplicate key -> someone else holds lock
            pass

        if time.time() >= deadline:
            return False

        time.sleep(0.5)

def release_lock(lock_key: str = LOCK_KEY):
    """
    Release the DB lock (best-effort)
    """
    try:
        sb.table("locks").delete().eq("key", lock_key).execute()
    except Exception:
        pass

# =========================
# PROMPT BUILDER
# =========================
def build_json_prompt(ingredients: List[str], title: Optional[str] = None) -> str:
    ingredient_text = ", ".join(ingredients)
    title_text = title or ""

    return f"""
You are an expert recipe writer.

You must return EXACTLY ONE valid JSON object and NOTHING ELSE.

SCHEMA:
{{
  "title": string,
  "overview": {{
    "description": string,
    "servings": string,
    "prep_time": string,
    "cook_time": string
  }},
  "ingredients": [
    {{
      "quantity": string,
      "unit": string,
      "item": string,
      "notes": string
    }}
  ],
  "equipment": [string],
  "instructions": [string],
  "tags": [string]
}}

RULES:
- Output only valid JSON
- Do NOT include markdown
- Do NOT include commentary
- Do NOT omit any keys
- Instructions must be plain step strings, not numbered lists
- If unsure, use empty strings instead of null

INPUTS:
Ingredients: {ingredient_text}
Optional Title: "{title_text}"

Now generate the recipe JSON:
""".strip()

# =========================
# GEMINI CALL
# =========================
def call_gemini(prompt: str) -> str:
    try:
        resp = ai_client.models.generate_content(
            model=MODEL_ID,
            contents=prompt
        )
    except Exception as e:
        raise RuntimeError(f"Gemini call failed: {e}")

    # Try common response formats
    text = getattr(resp, "text", None)

    if not text and isinstance(resp, dict):
        if "candidates" in resp and resp["candidates"]:
            cand = resp["candidates"][0]
            if isinstance(cand, dict):
                text = cand.get("content") or cand.get("text")

        if not text and "output" in resp:
            out = resp["output"]
            if isinstance(out, list) and out:
                if isinstance(out[0], dict):
                    text = out[0].get("content")

    if not text:
        text = str(resp)

    return text

# =========================
# JSON EXTRACTION / PARSING
# =========================
def extract_first_json(text: str) -> str:
    """
    Extract the first full JSON object from a string using brace matching
    """
    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON found in AI output")

    stack = 0
    for i in range(start, len(text)):
        if text[i] == "{":
            stack += 1
        elif text[i] == "}":
            stack -= 1
            if stack == 0:
                return text[start:i+1]

    raise ValueError("Incomplete JSON in AI output")

def normalize_recipe(parsed: Dict[str, Any]) -> Dict[str, Any]:
    """
    Enforce schema defaults and basic sanitation
    """
    defaults = {
        "title": "Untitled Recipe",
        "overview": {
            "description": "",
            "servings": "",
            "prep_time": "",
            "cook_time": ""
        },
        "ingredients": [],
        "equipment": [],
        "instructions": [],
        "tags": []
    }

    for key, default_val in defaults.items():
        if key not in parsed or parsed[key] is None:
            parsed[key] = default_val

    # Force ingredients into object format if model returned strings
    normalized_ingredients = []
    for ing in parsed["ingredients"]:
        if isinstance(ing, str):
            normalized_ingredients.append({
                "quantity": "",
                "unit": "",
                "item": ing,
                "notes": ""
            })
        elif isinstance(ing, dict):
            normalized_ingredients.append({
                "quantity": str(ing.get("quantity", "")),
                "unit": str(ing.get("unit", "")),
                "item": str(ing.get("item", "")),
                "notes": str(ing.get("notes", ""))
            })
    parsed["ingredients"] = normalized_ingredients

    # Ensure lists are lists
    for list_key in ["equipment", "instructions", "tags"]:
        if not isinstance(parsed[list_key], list):
            parsed[list_key] = []

    return parsed

def generate_json_from_gemini(ingredients: List[str], title: Optional[str] = None) -> Dict[str, Any]:
    prompt = build_json_prompt(ingredients, title)
    raw_text = call_gemini(prompt)

    json_str = extract_first_json(raw_text)
    parsed = json.loads(json_str)
    parsed = normalize_recipe(parsed)

    parsed["_raw_text"] = raw_text
    return parsed

# =========================
# DB SAVE
# =========================
def save_structured_recipe(recipe: Dict[str, Any]):
    payload = {
        "title": recipe["title"],
        "overview": recipe["overview"],
        "ingredients": recipe["ingredients"],
        "equipment": recipe["equipment"],
        "instructions": recipe["instructions"],
        "raw_text": recipe.get("_raw_text", ""),
        "tags": recipe["tags"],
        "ai_generated": True,
        "metadata": {
            "provider": "gemini",
            "model": MODEL_ID,
            "timestamp": time.time()
        }
    }

    return sb.table("recipes").insert(payload).execute()

# =========================
# PRIMARY FUNCTIONS
# =========================
def generate_and_store_auto(ingredients: List[str], wait: int = 5):
    if not acquire_lock(wait=wait):
        raise RuntimeError("Another recipe generation is already running")

    try:
        recipe = generate_json_from_gemini(ingredients, title=None)
        db_res = save_structured_recipe(recipe)
        return {
            "status": "ok",
            "title": recipe["title"],
            "db_response": db_res
        }
    finally:
        release_lock()

def generate_and_store_with_title(ingredients: List[str], title: str, wait: int = 5):
    if not acquire_lock(wait=wait):
        raise RuntimeError("Another recipe generation is already running")

    try:
        recipe = generate_json_from_gemini(ingredients, title=title)
        db_res = save_structured_recipe(recipe)
        return {
            "status": "ok",
            "title": recipe["title"],
            "db_response": db_res
        }
    finally:
        release_lock()

# =========================
# CLI
# =========================
def main():
    parser = argparse.ArgumentParser(
        description="Generate structured recipes using Gemini and store them in Supabase"
    )

    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--auto", action="store_true", help="AI generates title and recipe")
    mode.add_argument("--title", type=str, help="Use provided title and generate recipe")

    parser.add_argument("--ingredients", type=str, required=True, help="Comma-separated ingredient list")
    parser.add_argument("--wait", type=int, default=5, help="Seconds to wait for generation lock")

    args = parser.parse_args()

    ingredients = [i.strip() for i in args.ingredients.split(",") if i.strip()]
    if not ingredients:
        print("ERROR: No valid ingredients provided", file=sys.stderr)
        sys.exit(1)

    try:
        if args.auto:
            result = generate_and_store_auto(ingredients, wait=args.wait)
        else:
            result = generate_and_store_with_title(ingredients, args.title, wait=args.wait)

        print("\n" + "=" * 60)
        print("Recipe saved successfully")
        print("Title:", result["title"])
        print("=" * 60 + "\n")

    except Exception as e:
        print("ERROR:", e, file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
