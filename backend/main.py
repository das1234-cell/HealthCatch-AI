import os
import io
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image

load_dotenv(override=True)

# 🔴 এখানে তোমার একদম নতুন তৈরি করা চাবিটা বসাবে
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    GEMINI_API_KEY = "তোমার_নতুন_চাবি_এখানে_বসাও"

genai.configure(api_key=GEMINI_API_KEY)

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
    try:
        available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        
        # 🔴 এবার আমরা প্রো (Pro) মডেলে যাব না। শুধু ফ্রি ফ্ল্যাশ (Flash) মডেল খুঁজব।
        target_model = None
        for m in available_models:
            if 'flash' in m: # যেকোনো flash মডেল (যেমন 1.5-flash বা 3.0-flash)
                target_model = m
                break
                
        if not target_model:
            target_model = available_models[0] # ফ্ল্যাশ না পেলে বাধ্য হয়ে অন্যটা নেবে
            
        print(f"🎯 Using completely FREE Model: {target_model}")
        
        model = genai.GenerativeModel(target_model)
        
        system_prompt = "You are a highly empathetic AI mental health counselor for 'HealthCatch AI'. Keep answers brief and helpful. If the user uploads a prescription or medical image, gently remind them that you are an AI and they should consult a real doctor, but explain the contents in simple terms."
        
        contents = [system_prompt]
        if message:
            contents.append(message)
        else:
            contents.append("Please analyze this attached file.")
            
        if file and file.filename:
            image_data = await file.read()
            image = Image.open(io.BytesIO(image_data))
            contents.append(image)
            
        response = model.generate_content(contents)
        return {"reply": response.text}
            
    except Exception as e:
        print("❌ Error:", str(e))