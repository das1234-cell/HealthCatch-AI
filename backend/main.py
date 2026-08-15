import os
import base64
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import requests

load_dotenv(override=True)

# 🔴 এখানে তোমার OpenRouter থেকে কপি করা নতুন চাবিটা বসাও
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    OPENROUTER_API_KEY = "" # এখানে চাবি ফাঁকা রাখো
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/chat")
async def chat_with_agent(message: str = Form(""), file: UploadFile = File(None)):
    print("\n🔑 Processing with OpenRouter Free API...")
    try:
        # OpenRouter-এর হেডার
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        
        system_prompt = "You are a highly empathetic AI mental health counselor for 'HealthCatch AI'. Keep answers brief and helpful. If the user uploads a prescription or medical image, gently remind them that you are an AI and they should consult a real doctor, but explain the contents in simple terms."
        
        # ইউজার মেসেজ তৈরি করা
        text_content = f"{system_prompt}\n\nUser: {message if message else 'Please analyze this attached file.'}"
        
        content = [
            {"type": "text", "text": text_content}
        ]
        
        # যদি ছবি আপলোড হয়, সেটাকে Base64 এ কনভার্ট করা
        if file and file.filename:
            image_data = await file.read()
            base64_image = base64.b64encode(image_data).decode('utf-8')
            mime_type = file.content_type or "image/jpeg"
            
            content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:{mime_type};base64,{base64_image}"
                }
            })
        
        # OpenRouter-এর ফ্রি Vision মডেল রিকোয়েস্ট
        data = {
            "model": "meta-llama/llama-3.2-11b-vision-instruct:free", # ১০০% ফ্রি মডেল
            "messages": [
                {
                    "role": "user",
                    "content": content
                }
            ]
        }
        
        # API-তে কল করা
        response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data)
        response_json = response.json()
        
        if "choices" in response_json:
            reply = response_json["choices"][0]["message"]["content"]
            print("✅ Success with OpenRouter!")
            return {"reply": reply}
        else:
            print("❌ OpenRouter Error:", response_json)
            return {"reply": "Sorry, the AI service is temporarily busy. Please try again."}
            
    except Exception as e:
        print("❌ Error:", str(e))
        return {"reply": f"Technical Issue: {str(e)}"}