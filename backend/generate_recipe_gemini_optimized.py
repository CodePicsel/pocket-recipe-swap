import os
import sys
import argparse
from google import genai  # The new, supported library
from dotenv import load_dotenv

# Load environment variables
load_dotenv(".env.local")

# Configuration
# Use 'gemini-2.0-flash' if available, otherwise 'gemini-1.5-flash'
MODEL_ID = "gemini-2.0-flash-exp"

def build_prompt(ingredients: list[str], title: str = None) -> str:
    """
    Constructs the prompt. If title is None, asks AI to generate one.
    """
    ingr_list = ", ".join(ingredients)
    
    if title:
        title_instruction = f'Recipe title: "{title}"'
    else:
        title_instruction = 'Recipe title: Create a creative, appetizing title based on the ingredients.'

    return f"""
    You are an expert chef. Write a detailed recipe.
    
    Ingredients provided: {ingr_list}
    {title_instruction}

    Requirements:
    1. **Title:** Put the title on the first line formatted as a Markdown Header (e.g., "# Title").
    2. **Overview:** Short description with servings, prep time, and cook time.
    3. **Ingredients:** List provided ingredients + common pantry items (oil, salt, etc).
    4. **Equipment:** List required tools.
    5. **Instructions:** Numbered, step-by-step cooking steps.
    6. **Plain Text:** Do not output JSON.
    """

def generate_recipe(ingredients: list[str], title: str = None):
    """
    Single function that handles both custom titles and AI-generated titles.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY not found in .env.local", file=sys.stderr)
        sys.exit(1)

    # Initialize the new Client
    client = genai.Client(api_key=api_key)

    prompt = build_prompt(ingredients, title)
    
    print(f"Contacting Gemini ({MODEL_ID})...")
    
    try:
        # The new SDK syntax
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt
        )
        return response.text
    except Exception as e:
        print(f"\nError calling Gemini: {e}", file=sys.stderr)
        return None

def main():
    parser = argparse.ArgumentParser(description="Generate a recipe using Gemini.")
    parser.add_argument("--ingredients", type=str, help="Comma-separated ingredients")
    parser.add_argument("--title", type=str, help="Optional: Recipe Title. If omitted, AI generates one.")
    
    args = parser.parse_args()

    # 1. Get Ingredients
    if args.ingredients:
        raw_ing = args.ingredients
    else:
        # Fallback to interactive input if no flags provided
        raw_ing = input("Ingredients (comma-separated): ").strip()
    
    ing_list = [i.strip() for i in raw_ing.split(",") if i.strip()]
    if not ing_list:
        print("Error: No ingredients provided.")
        sys.exit(1)

    # 2. Generate Recipe (Logic handles title being None automatically)
    recipe_text = generate_recipe(ing_list, title=args.title)

    # 3. Print Result
    if recipe_text:
        print("\n" + "="*80 + "\n")
        print(recipe_text)
        print("\n" + "="*80 + "\n")

if __name__ == '__main__':
    main()