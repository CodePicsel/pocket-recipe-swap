import os
import sys
import textwrap 
import argparse
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(".env.local")
#if u have cloned the repository and using directly .env.example then use this statement instead.
# load_dotenv(".env.example")


def build_prompt(title: str, ingredients: list[str])->str:
    ingr_list = ", ".join(ingredients)
    return f"""
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

def generate_recipe(title: str, ingredients: list[str]):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY not found.", file=sys.stderr)
        sys.exit(1)

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash')
    prompt = build_prompt(title, ingredients)
    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=2048,
                temperature=.7
            )
        )
        return response.text
    except Exception as e:
        print(f"Error calling Gemini: {e}", file=sys.stderr)
        return None
    
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--title", type=str, default="Hello World")
    parser.add_argument("--ingredients", type=str, default="tomate, egg, cheese")
    args = parser.parse_args()
    ing_list = [i.strip() for i in args.ingredients.split(",")]
    recipe_text = generate_recipe(args.title, ing_list)
    if recipe_text:
        print("\n"+"="*80 +"\n")
        print(recipe_text)
        print("\n"+"="*80 +"\n")

if __name__ == "__main__":
    main()
