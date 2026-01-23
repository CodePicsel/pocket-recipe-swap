# print('Recipe')

import os
import sys
import textwrap
import json
import argparse
import requests

DEFAULT_MAX_TOKEN = 1500

def build_prompt(title: str, ingredients: list[str]) -> str:
    ingr_list = ", ".join(ingredients)
    prompt = f"""
    You are an expert chef and food writer. Write a full, detailed, step-by-step recipe for the following:

    Recipe title: "{title}"
    Ingredients (only these three): {ingr_list}

    Requirements:
    1. Provide a short Overview with servings, estimated prep time and cook time.
    2. Provide a clear Ingredients section. You may suggest reasonable quantities for each of the three ingredients, and add common pantry items (salt, oil, pepper, water, butter, sugar) if necessary — but mark them as optional or "pantry items".
    3. Provide an Equipment section listing everything needed.
    4. Provide a numbered Step-by-step Instructions section. Each step should:
       - Be concise but detailed (explain technique where relevant),
       - Include an estimated time for the step (e.g., "5–7 minutes"),
       - Provide one practical cooking tip where appropriate.
    5. Provide optional Variations (2–3 ideas) and Storage/Serving instructions.
    6. At the end give a short Nutrition/Servings note (approximate calories per serving is fine).
    7. Use plain text only (no JSON). Do not include any commentary about being an AI, or about the request itself. Output the recipe in a readable human-friendly format.

    Generate the full recipe now.
    """
    return textwrap.dedent(prompt).strip()

def call_gemini(prompt: str, max_tokens: int = DEFAULT_MAX_TOKEN, timeout: int = 30) -> dict | str:
    from pathlib import Path
    from dotenv import load_dotenv

    # Load .env.local (adjust path if needed)
    env_path = Path(__file__).resolve().parent / ".env.local"
    load_dotenv(env_path)

    base_url = os.getenv("GEMINI_API_URL")
    api_key = os.getenv("GEMINI_API_KEY")
    if not base_url or not api_key:
        raise RuntimeError("GEMINI_API_URL and GEMINI_API_KEY must be set in .env.local")

    sep = "&" if "?" in base_url else "?"
    final_url = f"{base_url}{sep}key={api_key}"

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": 0.7
        }
    }

    try:
        resp = requests.post(final_url, headers=headers, json=payload, timeout=timeout)
        resp.raise_for_status()
    except requests.HTTPError as http_err:
        # show server JSON body if available (helpful for debugging)
        try:
            body = resp.json()
        except Exception:
            body = resp.text
        raise requests.HTTPError(f"HTTP {resp.status_code} error calling Gemini: {body}") from http_err

    content_type = resp.headers.get("Content-Type", "")
    if "application/json" in content_type:
        return resp.json()
    else:
        return resp.text

# def debug_call_gemini(prompt: str, max_tokens: int = DEFAULT_MAX_TOKEN, timeout: int = 30) -> dict | str:
    """
    Robust call to Google Generative Language `generateContent`.
    - Loads .env.local
    - Tries canonical payload, and if it gets a 4xx/5xx tries common fallback payloads
    - On error prints full server response (status, headers, body) and request payload used
    """
    from pathlib import Path
    from dotenv import load_dotenv
    import traceback

    # load .env.local from script directory
    env_path = Path(__file__).resolve().parent / ".env.local"
    load_dotenv(env_path)

    base_url = os.getenv("GEMINI_API_URL")
    api_key = os.getenv("GEMINI_API_KEY")
    if not base_url or not api_key:
        raise RuntimeError("GEMINI_API_URL and GEMINI_API_KEY must be set in .env.local")

    sep = "&" if "?" in base_url else "?"
    final_url = f"{base_url}{sep}key={api_key}"

    headers = {"Content-Type": "application/json", "Accept": "application/json"}

    # candidate payload shapes to try (ordered)
    payloads = []

    # 1) canonical shape (recommended)
    payloads.append({
        "maxOutputTokens": max_tokens,
        "temperature": 0.7,
        "contents": [
            {"role": "user", "parts": [{"text": prompt}]}
        ]
    })

    # 2) same but without role (some examples omit role)
    payloads.append({
        "maxOutputTokens": max_tokens,
        "temperature": 0.7,
        "contents": [
            {"parts": [{"text": prompt}]}
        ]
    })

    # 3) simpler "input" style (some SDKs / proxies expect this)
    payloads.append({
        "maxOutputTokens": max_tokens,
        "temperature": 0.7,
        "input": prompt
    })

    # 4) OpenAI-like fallback (very generic)
    payloads.append({
        "prompt": prompt,
        "max_tokens": max_tokens,
        "temperature": 0.7
    })

    last_exc = None

    for idx, payload in enumerate(payloads, start=1):
        try:
            # Debug: do not print full key; show only prefix
            print(f"[gemini] Attempt {idx}: POST {final_url} with payload keys {list(payload.keys())}")
            resp = requests.post(final_url, headers=headers, json=payload, timeout=timeout)
            # If non-2xx, still capture body and show detailed info
            try:
                resp.raise_for_status()
            except requests.HTTPError as e:
                # Try to show helpful debug info
                body_text = None
                try:
                    body_text = resp.json()
                except Exception:
                    body_text = resp.text
                print(f"[gemini] HTTP {resp.status_code} for attempt {idx}. Response body:")
                print(json.dumps(body_text, indent=2) if isinstance(body_text, (dict, list)) else body_text)
                # continue to next payload shape
                last_exc = e
                continue

            # success: return parsed JSON if possible, else text
            content_type = resp.headers.get("Content-Type", "")
            if "application/json" in content_type:
                return resp.json()
            else:
                return resp.text

        except requests.RequestException as e:
            # Network-level or timeout; print partial debug and continue
            print(f"[gemini] Network error on attempt {idx}: {e}")
            traceback.print_exc(limit=1)
            last_exc = e
            continue

    # If we reached here, all attempts failed. Raise a clear error including last response if present.
    raise RuntimeError(f"All Gemini payload attempts failed. Last exception: {last_exc}")


def extract_text_from_response(resp) -> str:
    if isinstance(resp, str):
        return resp.strip()
    if not resp:
        return ""
    if isinstance(resp, dict):
        if "output" in resp:
            out = resp["output"]
            if isinstance(out, str):
                return out.strip()
            if isinstance(out, list):
                parts = []
                for item in out:
                    if isinstance(item , str):
                        parts.append(item)
                    elif isinstance(item, dict):
                        if "content" in item and isinstance(item["content"], str):
                            parts.append(item["content"])
                        else:
                            parts.append(json.dumps(item))
                return "\n\n" .join(p.strip() for p in parts if p)
        
        if "candidates" in resp and isinstance(resp["candidates"], list) and resp["candidates"]:
            c0 = resp["candidates"][0]
            if isinstance(c0, dict) and "content" in c0:
                content = c0["content"]
                if isinstance(content, dict) and "parts" in content:
                    parts = content["parts"]
                    if isinstance(parts, list):
                        texts = [p["text"] for p in parts if isinstance(p, dict) and "text" in p]
                        return "\n".join(texts).strip()
            if isinstance(c0, str):
                return c0.strip()

        if "choices" in resp and isinstance(resp["choices"], list) and resp["choices"]:
            c0 = resp["choices"][0]
            if isinstance(c0, dict):
                if "text" in c0 and isinstance(c0["text"], str):
                    return c0["text"].strip()
                if "message" in c0 and isinstance(c0["message"], dict):
                    msg = c0["message"]
                    if "content" in msg:
                        content = msg ["content"]
                        if isinstance(content, str):
                            return content.strip()
                        if isinstance(content, dict) and "parts" in content and isinstance(content["parts"], list):
                            return "".join(part for part in content["parts"] if isinstance(part, str)).strip()
            if isinstance(c0, str):
                return c0.strip()
        for key in ("result", "text", "output_text", "generated_text"):                
            if key in resp and isinstance(resp[key], str):
                return resp[key].strip()
    
    if isinstance(resp, list):
        for item in resp:
            if isinstance(item, str):
                return item.strip()
            elif isinstance(item, dict):
                val = extract_text_from_response(item)
                if val:
                    return val
    try:
        return json.dumps(resp, indent=2)
    except Exception:
        return str(resp)

def pretty_print_recipe(text: str):
    print("\n" + "="*80+"\n")
    print(text.strip())
    print("\n" + "="*80+"\n")

def main(argv=None):
    parser = argparse.ArgumentParser(description="Generate a detailed recipe using Gemini.")
    parser.add_argument("--title", type=str, help="Recipe Title")
    parser.add_argument("--ingredients", type=str, help="Comma-separated three ingredients (eg. 'tomato, egg, cheese')")
    parser.add_argument("--max-tokens", type=int, default=DEFAULT_MAX_TOKEN, help="Max TOkens for the model")
    args = parser.parse_args(argv)

    if args.title:
        title = args.title.strip()
    else:
        title = input("Recipe title: ").strip()
        if not title:
            print("Error: title required.", file=sys.stderr)
            sys.exit(1)

    if args.ingredients:
        raw = args.ingredients.strip()
    else:
        raw = input("Three ingredients (comma-separated): ").strip()
    
    ingredients = [i.strip() for i in raw.split(",") if i.strip()]
    if len(ingredients) == 0:
        print("Error: at least one ingredient required.", file=sys.stderr)
        sys.exit(1)
    if len(ingredients) > 3:
        ingredients = ingredients[:3]
    prompt = build_prompt(title=title, ingredients=ingredients)
    try:
        resp= call_gemini(prompt, max_tokens=args.max_tokens)
    except requests.RequestException as e:
        print(f"Network or HTTP error calling gemini endpoints: {e}", file=sys.stderr)
        sys.exit(1)
    except RuntimeError as e:
        print(f"Configuration error: {e}", file=sys.stderr)
        sys.exit(1)
    text = extract_text_from_response(resp)
    if not text:
        print("No text could be extracted from the gemini response.", file=sys.stderr)
        print("Raw response (debug):")
        print(json.dumps(resp, indent=2) if isinstance(resp, (dict, list)) else str(resp))
        sys.exit(1)
    pretty_print_recipe(text)
if __name__ == '__main__':
    main()