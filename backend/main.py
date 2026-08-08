import os
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# 🔥 override=True দিলে সে জোর করে নতুন চাবিটাই নেবে!
load_dotenv(override=True)
api_key = os.getenv("GEMINI_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat_with_agent(request: ChatRequest):
    # নতুন চাবিটা কাজ করছে কি না, সেটা টার্মিনালে দেখাবে
    print(f"\n🔑 Using API Key starting with: {api_key[:5]}...")
    
    system_prompt = f"You are a highly empathetic, supportive, and compassionate AI mental health counselor for an app named 'HealthCatch AI'. Keep your answers brief, safe, and helpful. User says: {request.message}"
    
    # গুগলের সবচেয়ে হালকা এবং ফ্রি মডেলগুলো আগে ট্রাই করব
    models_to_try = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-flash-8b', 'gemini-2.5-pro']
    
    for model_name in models_to_try:
        try:
            print(f"⏳ Testing model: {model_name}...")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            
            payload = {
                "contents": [{"parts": [{"text": system_prompt}]}]
            }
            
            response = requests.post(url, json=payload)
            data = response.json()
            
            if 'candidates' in data:
                reply = data['candidates'][0]['content']['parts'][0]['text']
                print(f"✅ Success with {model_name}!")
                return {"reply": reply}
            else:
                error_msg = data.get('error', {}).get('message', 'Unknown')
                print(f"❌ {model_name} failed. Reason: {error_msg}")
        except Exception as e:
            print(f"❌ {model_name} error: {str(e)}")
            continue
            
    return {"reply": "Sorry, Google API blocked all requests. Please check terminal."}