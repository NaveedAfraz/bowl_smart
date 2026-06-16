import httpx

key = "YOUR_API_KEY"
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key}"

payload = {
    "contents": [{"parts": [{"text": "Write a one word response: Hello"}]}],
    "generationConfig": {
        "temperature": 0.7,
        "maxOutputTokens": 100,
        "thinkingConfig": {
            "thinkingBudget": 0
        }
    }
}

try:
    r = httpx.post(url, json=payload)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")
except Exception as e:
    print(f"Error: {e}")
