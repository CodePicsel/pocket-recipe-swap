#!/usr/bin/env python3
"""
FastAPI server to generate structured recipes with Gemini and store them in Supabase.

Endpoints:
- POST /generate-auto           -> body: { "ingredients": ["a","b", ...] }
- POST /generate-with-title     -> body: { "title": "...", "ingredients": [...] }
- GET  /recipes?limit=10        -> returns latest recipes (limit default 10)

Environment (.env.local):
GEMINI_API_KEY=...
MODEL_ID=gemini-2.5-flash
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_KEY=<service_role_key>
"""

import os
import sys
import time
import json
from typing import List, Optional, Dict, Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from google import genai
from supabase import create_client

# -------------------------
# Load env & validate
# -------------------------
load_dotenv(".env.local")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_ID = os.getenv("MODEL_ID", "gemini-2.5-flash")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # service_role recommended

if not GEMINI_API_KEY:
    print("ERROR: GEMINI_API_KEY not set in .env.local", file=sys.stderr)
    sys.exit(1)
if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: SUPABASE_URL and SUPABASE_KEY must be set in .env.local", file=sys.stderr)
    sys.exit(1)

# -------------------------
# Clients
# -------------------------
ai_client = genai.Client(api_key=GEMINI_API_KEY)
sb = create_client(SUPABASE_URL, SUPABASE_KEY)

# -------------------------
# FastAPI app
# -------------------------
app = FastAPI(title="Recipe Generator API")

# allow local dev CORS - adjust origins for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to your frontend origin(s) in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Pydantic models
# -------------------------
class IngredientsIn(BaseModel):
    ingredients: List[str] = Field(..., min_items=1)

class TitleAndIngredientsIn(BaseModel):
    title: str = Field(..., min_length=1)
    ingredients: List[str] = Field(..., min_items=1)

class RecipeOut(BaseModel):
    id: Optional[str]
    title: str
    overview: Dict[str, Any]
    ingredients: List[Dict[str, Any]]
    equipment: List[str]
    instructions: List[str]
    raw_text: str
    tags: List[str]
    created_at: Optional[str]
    metadata: Optional[Dict[str, Any]]

# -------------------------
# Lock utilities (DB row lock)
# -------------------------
LOCK_KEY = "recipe_generation"

def acquire_lock(lock_key: str = LOCK_KEY, owner: Optional[str] = None, wait: int = 5) -> bool:
    owner = owner or f"pid:{os.getpid()}"
    deadline = time.time() + wait
    while True:
        try:
            sb.table("locks").insert({"key": lock_key, "owner": owner}).execute()
            return True
        except Exception:
            # likely duplicate key -> lock held elsewhere
            pass
        if time.time() >= deadline:
            return False
        time.sleep(0.5)

def release_lock(lock_key: str = LOCK_KEY):
    try:
        sb.table("locks").delete().eq("key", lock_key).execute()
    except Exception:
        pass

# -------------------------
# Prompt + Gemini call helpers
# (keeps strict JSON schema for structured output)
# -------------------------
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
- Do NOT include markdown or commentary
- Do NOT omit any keys
- Instructions must be plain step strings (no numbering)
- If unsure, use empty strings/empty arrays

INPUTS:
Ingredients: {ingredient_text}
Optional Title: "{title_text}"

Now output the JSON object.
""".strip()

def call_gemini(prompt: str) -> str:
    try:
        resp = ai_client.models.generate_content(model=MODEL_ID, contents=prompt)
    except Exception as e:
        raise RuntimeError(f"Gemini call failed: {e}")

    text = getattr(resp, "text", None)
    if not text and isinstance(resp, dict):
        if "candidates" in resp and resp["candidates"]:
            cand = resp["candidates"][0]
            if isinstance(cand, dict):
                text = cand.get("content") or cand.get("text")
        if not text and "output" in resp:
            out = resp["output"]
            if isinstance(out, list) and out and isinstance(out[0], dict):
                text = out[0].get("content")
    if not text:
        text = str(resp)
    return text

# -------------------------
# JSON extraction / normalization
# -------------------------
def extract_first_json(text: str) -> str:
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
    defaults = {
        "title": "Untitled Recipe",
        "overview": {"description": "", "servings": "", "prep_time": "", "cook_time": ""},
        "ingredients": [],
        "equipment": [],
        "instructions": [],
        "tags": []
    }
    for k, dv in defaults.items():
        if k not in parsed or parsed[k] is None:
            parsed[k] = dv

    # normalize ingredients to objects
    normalized_ingredients = []
    for ing in parsed["ingredients"]:
        if isinstance(ing, str):
            normalized_ingredients.append({"quantity": "", "unit": "", "item": ing, "notes": ""})
        elif isinstance(ing, dict):
            normalized_ingredients.append({
                "quantity": str(ing.get("quantity", "")),
                "unit": str(ing.get("unit", "")),
                "item": str(ing.get("item", "")),
                "notes": str(ing.get("notes", ""))
            })
    parsed["ingredients"] = normalized_ingredients

    # ensure lists for equipment/instructions/tags
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

# -------------------------
# DB save & fetch helpers
# -------------------------
def save_structured_recipe(recipe: Dict[str, Any]) -> Dict[str, Any]:
    payload = {
        "title": recipe["title"],
        "overview": recipe["overview"],
        "ingredients": recipe["ingredients"],
        "equipment": recipe["equipment"],
        "instructions": recipe["instructions"],
        "raw_text": recipe.get("_raw_text", ""),
        "tags": recipe["tags"],
        "ai_generated": True,
        "metadata": {"provider": "gemini", "model": MODEL_ID, "timestamp": time.time()}
    }
    res = sb.table("recipes").insert(payload).execute()
    # res commonly returns dict with 'data' key
    if isinstance(res, dict):
        return res
    return {"data": res}

def normalize_sb_response(res) -> List[Dict[str, Any]]:
    """
    Turn various supabase client response shapes into a plain Python list of rows.
    Returns an empty list on unexpected shapes.
    """
    # Common dict shape: {"data": [...], "error": None, ...}
    if isinstance(res, dict):
        # sometimes data is under 'data' or 'body'
        if "data" in res and isinstance(res["data"], list):
            return res["data"]
        if "body" in res and isinstance(res["body"], list):
            return res["body"]
        # Some older clients embed result as ('data', [...]) or similar; try to find list value
        for v in res.values():
            if isinstance(v, list):
                return v
        return []

    # If response object has .data attribute (supabase-py / httpx style)
    if hasattr(res, "data"):
        maybe = getattr(res, "data")
        if isinstance(maybe, list):
            return maybe
        # sometimes .data is a dict with 'data'
        if isinstance(maybe, dict) and "data" in maybe and isinstance(maybe["data"], list):
            return maybe["data"]

    # If the client returned a tuple like (status, payload)
    if isinstance(res, (list, tuple)):
        # try to find the first list element
        for part in res:
            if isinstance(part, list):
                return part
        # If it's already a list of dicts, return it
        if isinstance(res, list) and all(isinstance(it, dict) for it in res):
            return list(res)

    # Fallback: try to coerce to list (best-effort)
    try:
        iterable = list(res)
        # keep only dict items
        return [x for x in iterable if isinstance(x, dict)]
    except Exception:
        return []

def fetch_recipes(limit: int = 10) -> List[Dict[str, Any]]:
    """
    Fetch latest recipes and return a plain list of dicts.
    """
    raw = sb.table("recipes").select("*").order("created_at", desc=True).limit(limit).execute()
    rows = normalize_sb_response(raw)
    # ensure list items are plain dicts (convert any custom row objects)
    normalized_rows = []
    for r in rows:
        if isinstance(r, dict):
            normalized_rows.append(r)
        else:
            # attempt to convert row-like objects to dict
            try:
                normalized_rows.append(dict(r))
            except Exception:
                # skip non-convertible item
                pass
    return normalized_rows

# -------------------------
# Primary endpoints
# -------------------------
@app.post("/generate-auto", response_model=RecipeOut, status_code=status.HTTP_201_CREATED)
def endpoint_generate_auto(payload: IngredientsIn):
    """
    Generate recipe (AI creates title) and store in Supabase.
    """
    if not acquire_lock(wait=5):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Another generation is running. Try again later.")

    try:
        recipe = generate_json_from_gemini(payload.ingredients, title=None)
        db_res = save_structured_recipe(recipe)
        data = db_res.get("data") if isinstance(db_res, dict) else db_res
        # return the first inserted row if available; else return normalized object
        if data and isinstance(data, list) and len(data) > 0:
            row = data[0]
            # include metadata in response
            row["metadata"] = db_res.get("data")[0].get("metadata") if isinstance(db_res.get("data"), list) else row.get("metadata")
            return row  # Pydantic will validate
        # fallback
        out = {
            "id": None,
            "title": recipe["title"],
            "overview": recipe["overview"],
            "ingredients": recipe["ingredients"],
            "equipment": recipe["equipment"],
            "instructions": recipe["instructions"],
            "raw_text": recipe.get("_raw_text", ""),
            "tags": recipe["tags"],
            "created_at": None,
            "metadata": {"provider": "gemini", "model": MODEL_ID}
        }
        return out
    finally:
        release_lock()
@app.get("/recipes/meta")
def endpoint_recipes_meta():
    """
    Lightweight metadata for cache validation:
    - count: total rows in recipes (approx)
    - latest: most recent created_at (ISO string) or None
    """
    try:
        # get latest created_at (most recent row)
        latest_res = sb.table("recipes").select("created_at").order("created_at", desc=True).limit(1).execute()
        latest_rows = normalize_sb_response(latest_res)
        latest = None
        if latest_rows and isinstance(latest_rows[0], dict):
            latest = latest_rows[0].get("created_at")

        # naive count: if your supabase client supports exact count prefer using that.
        count_res = sb.table("recipes").select("id").execute()
        count_rows = normalize_sb_response(count_res)
        count = len(count_rows)

        return {"count": count, "latest": latest}
    except Exception as ex:
        print("ERROR fetching recipes meta:", ex)
        raise HTTPException(status_code=500, detail="Failed to read metadata")

@app.post("/generate-with-title", response_model=RecipeOut, status_code=status.HTTP_201_CREATED)
def endpoint_generate_with_title(payload: TitleAndIngredientsIn):
    """
    Generate recipe using the provided title and store in Supabase.
    """
    if not acquire_lock(wait=5):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Another generation is running. Try again later.")
    try:
        recipe = generate_json_from_gemini(payload.ingredients, title=payload.title)
        db_res = save_structured_recipe(recipe)
        data = db_res.get("data") if isinstance(db_res, dict) else db_res
        if data and isinstance(data, list) and len(data) > 0:
            return data[0]
        out = {
            "id": None,
            "title": recipe["title"],
            "overview": recipe["overview"],
            "ingredients": recipe["ingredients"],
            "equipment": recipe["equipment"],
            "instructions": recipe["instructions"],
            "raw_text": recipe.get("_raw_text", ""),
            "tags": recipe["tags"],
            "created_at": None,
            "metadata": {"provider": "gemini", "model": MODEL_ID}
        }
        return out
    finally:
        release_lock()

@app.get("/recipes", response_model=List[RecipeOut])
def endpoint_get_recipes(limit: int = 10):
    """
    Fetch latest `limit` recipes (default 10).
    """
    if limit <= 0 or limit > 100:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 100")

    raw = sb.table("recipes").select("*").order("created_at", desc=True).limit(limit).execute()
    rows = normalize_sb_response(raw)

    # If normalize returned empty but raw contains something unexpected, log it for debugging
    if not rows:
        # Helpful debug log — remove or reduce verbosity in production
        print("DEBUG: supabase raw response (unexpected shape):", repr(raw))

    return rows
# -------------------------
# Run note (use uvicorn)
# -------------------------
# Run server:
# uvicorn server:app --reload --port 8000
#
# Example requests:
# POST /generate-auto   { "ingredients": ["potato","besan","pav"] }
# POST /generate-with-title { "title":"My Title", "ingredients": ["potato","besan"] }
# GET  /recipes?limit=5
