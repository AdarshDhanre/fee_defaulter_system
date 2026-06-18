import os
import json
import time
from google import genai
from google.genai import types

# Models to try in order (primary → fallback)
GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b']
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds between retries

def _parse_json_response(raw_text):
    """Parse JSON from Gemini response, handling markdown wrappers."""
    raw_text = raw_text.strip()
    if raw_text.startswith("```json"):
        raw_text = raw_text.replace("```json", "", 1)
    if raw_text.startswith("```"):
        raw_text = raw_text.replace("```", "", 1)
    if raw_text.endswith("```"):
        raw_text = raw_text[:-3]
    return json.loads(raw_text.strip())

def extract_receipt_data(image_path):
    """
    Uses Gemini to scan an offline bank receipt and extract structured data.
    Automatically retries with exponential backoff and falls back to a
    lighter model if the primary model is overloaded (503 UNAVAILABLE).
    Returns a dictionary with transaction_id, amount, date, and confidence.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "API Key not found."}

    prompt = """
    Analyze this bank transaction receipt/challan.
    Extract the following information and return ONLY a valid JSON object. Do not include markdown formatting or extra text.
    
    Required JSON format:
    {
        "transaction_id": "Extract the 12 to 16 digit UTR or Transaction/Reference Number",
        "amount": "Extract the numeric amount paid (just the number without commas or currency symbols)",
        "date": "Extract the date of transaction in DD/MM/YYYY format",
        "confidence": "High, Medium, or Low depending on how clearly you can read it"
    }
    
    If a field is missing or unreadable, set its value to null.
    """

    client = genai.Client(api_key=api_key)
    last_error = None

    for model_name in GEMINI_MODELS:
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                print(f"[OCR] Trying model={model_name}, attempt={attempt}/{MAX_RETRIES}")

                # Upload image to Gemini File API
                sample_file = client.files.upload(file=image_path)

                response = client.models.generate_content(
                    model=model_name,
                    contents=[sample_file, prompt]
                )

                # Clean up uploaded file from Google's servers
                try:
                    client.files.delete(name=sample_file.name)
                except Exception:
                    pass

                data = _parse_json_response(response.text)
                print(f"[OCR] Success with model={model_name} on attempt={attempt}")
                return data

            except Exception as e:
                last_error = e
                error_str = str(e)
                print(f"[OCR] Error (model={model_name}, attempt={attempt}): {error_str}")

                # 503 / UNAVAILABLE → retry with backoff, then try next model
                if "503" in error_str or "UNAVAILABLE" in error_str or "high demand" in error_str.lower():
                    if attempt < MAX_RETRIES:
                        wait = RETRY_DELAY * attempt  # 2s, 4s, 6s ...
                        print(f"[OCR] Model busy. Waiting {wait}s before retry...")
                        time.sleep(wait)
                        continue
                    else:
                        print(f"[OCR] All {MAX_RETRIES} retries exhausted for {model_name}. Trying next model...")
                        break  # Move to next model

                # JSON parse error → no point retrying, return gracefully
                elif isinstance(e, (json.JSONDecodeError, ValueError)):
                    print("[OCR] JSON parse error. Returning raw text.")
                    return {"error": "Could not parse AI response. Please try again."}

                # Other errors → break out and try next model
                else:
                    break

    print(f"[OCR] All models failed. Last error: {last_error}")
    return {"error": "AI scan failed due to high demand. Please try again in a moment."}
