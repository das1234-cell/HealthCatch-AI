import os
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# .env ফাইল থেকে Groq-এর চাবি লোড করা
load_dotenv()

# 🔴 গিটহাব পুশ প্রোটেকশন থেকে বাঁচতে সরাসরি চাবি না লিখে .env থেকে নেওয়া হলো
api_key = os.getenv("GROQ_API_KEY")

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
    print(f"\n🔑 Using Groq API Key...")
    
    system_prompt = "You are a highly empathetic, supportive, and compassionate AI mental health counselor for an app named 'HealthCatch AI'. Keep your answers brief, safe, and helpful."
    
    try:
        # গুগলের বদলে আমরা Groq এর সার্ভারে ডাইরেক্ট রিকোয়েস্ট পাঠাচ্ছি
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # নতুন মডেল ব্যবহার করা হচ্ছে
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message}
            ]
        }
        
        response = requests.post(url, headers=headers, json=payload)
        data = response.json()
        
        if 'choices' in data:
            reply = data['choices'][0]['message']['content']
            print("✅ Success with Groq!")
            return {"reply": reply}
        else:
            print("❌ Groq Error:", data)
            return {"reply": "Sorry, I am facing a temporary issue with my new brain."}
            
    except Exception as e:
        print("❌ Request failed:", str(e))
        return {"reply": "Sorry, I am facing a technical issue connecting to my network."}