import os
import json
from google import genai
from google.genai import types

def extract_receipt_data(image_path):
    """
    Uses Gemini 2.5 Flash to scan an offline bank receipt and extract structured data.
    Returns a dictionary with status, utr, amount, date, and confidence.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "API Key not found."}

    try:
        client = genai.Client(api_key=api_key)
        
        # Open and upload the image file using the new genai File API
        # Wait, the new client supports passing local files directly via types.Part.from_bytes or similar,
        # but let's upload the file to Gemini first using client.files.upload
        sample_file = client.files.upload(file=image_path)
        
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
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[sample_file, prompt]
        )
        
        # Clean up the file from Google's servers
        try:
            client.files.delete(name=sample_file.name)
        except:
            pass

        # Parse JSON
        raw_text = response.text.strip()
        # Sometimes Gemini adds ```json ... ``` wrapper
        if raw_text.startswith("```json"):
            raw_text = raw_text.replace("```json", "", 1)
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
            
        data = json.loads(raw_text.strip())
        return data

    except Exception as e:
        print("OCR Service Error:", e)
        return {"error": str(e)}
