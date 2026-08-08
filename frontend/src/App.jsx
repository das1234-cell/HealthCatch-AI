import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, MessageSquare, HeartPulse, ClipboardList, BrainCircuit, Send, User, Bot, Loader2 } from 'lucide-react';

// গ্রাফের ডেমো ডেটা
const moodData = [
  { day: 'Mon', score: 4 }, { day: 'Tue', score: 6 }, { day: 'Wed', score: 5 },
  { day: 'Thu', score: 8 }, { day: 'Fri', score: 7 }, { day: 'Sat', score: 9 }, { day: 'Sun', score: 7.2 },
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // চ্যাটের মেসেজগুলো সেভ করে রাখার State
  const [messages, setMessages] = useState([
    { sender: 'ai', text: "Hello there! I'm your HealthCatch AI Counselor. How are you feeling today? Remember, this is a safe space." }
  ]);
  
  // ইউজার যা টাইপ করছে সেটা ধরে রাখার State
  const [input, setInput] = useState('');
  
  // AI উত্তর টাইপ করার সময় লোডিং দেখানোর State
  const [isLoading, setIsLoading] = useState(false);

  // মেসেজ পাঠানোর ফাংশন
  const handleSendMessage = async () => {
    if (!input.trim()) return; // ফাঁকা মেসেজ পাঠাতে বাধা দেওয়া

    const userMessage = { sender: 'user', text: input };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages); // ইউজারের মেসেজ স্ক্রিনে দেখানো
    setInput(''); // ইনপুট বক্স ফাঁকা করে দেওয়া
    setIsLoading(true); // লোডিং অ্যানিমেশন চালু করা

    try {
      // ব্যাকএন্ডের (FastAPI) সাথে যোগাযোগ করা
      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      
      // AI-এর উত্তর স্ক্রিনে দেখানো
      setMessages([...newMessages, { sender: 'ai', text: data.reply }]);
    } catch (error) {
      setMessages([...newMessages, { sender: 'ai', text: "Sorry, I am facing a network issue connecting to the server." }]);
    } finally {
      setIsLoading(false); // লোডিং অ্যানিমেশন বন্ধ করা
    }
  };

  // Enter বাটন চাপলে মেসেজ সেন্ড হওয়ার ফাংশন
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-[#0F172A] text-white font-sans overflow-hidden">
      
      {/* বাঁ-দিকের নেভিগেশন সাইডবার */}
      <div className="w-64 bg-[#1E293B] p-6 flex flex-col gap-2 border-r border-slate-700 shadow-xl z-10">
        <h1 className="text-2xl font-bold text-blue-500 mb-8 flex items-center gap-3">
          <BrainCircuit size={32} /> HealthCatch 
        </h1>
        
        <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-3 text-left px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800 text-slate-300'}`}>
          <LayoutDashboard size={20} /> Dashboard
        </button>
        
        <button onClick={() => setActiveTab('chat')} className={`flex items-center gap-3 text-left px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'chat' ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800 text-slate-300'}`}>
          <MessageSquare size={20} /> AI Chatbot
        </button>

        <button className="flex items-center gap-3 text-left px-4 py-3 hover:bg-slate-800 rounded-xl text-slate-300 transition-all">
          <HeartPulse size={20} /> Mood Tracker
        </button>
        
        <button className="flex items-center gap-3 text-left px-4 py-3 hover:bg-slate-800 rounded-xl text-slate-300 transition-all">
          <ClipboardList size={20} /> Assessments
        </button>
      </div>

      {/* ডান দিকের মেইন স্ক্রিন */}
      <div className="flex-1 flex flex-col h-full bg-[#0F172A]">
        
        {/* Dashboard পেজ */}
        {activeTab === 'dashboard' && (
          <div className="p-10 flex flex-col h-full overflow-y-auto">
            <h2 className="text-3xl font-bold mb-2 text-white">Welcome back, User! 👋</h2>
            <p className="text-slate-400 mb-10">Here is your mental wellness summary for this week.</p>
            
            <div className="flex gap-6 mb-8">
              <div className="flex-1 bg-[#1E293B] p-6 rounded-2xl border border-slate-700 shadow-md">
                <h3 className="text-slate-400 text-sm font-medium">Mood This Week</h3>
                <p className="text-3xl font-bold text-green-400 mt-2">7.2 <span className="text-lg text-slate-500">/ 10</span></p>
              </div>
              <div className="flex-1 bg-[#1E293B] p-6 rounded-2xl border border-slate-700 shadow-md">
                <h3 className="text-slate-400 text-sm font-medium">Assessments Taken</h3>
                <p className="text-3xl font-bold text-blue-400 mt-2">3</p>
              </div>
              <div className="flex-1 bg-[#1E293B] p-6 rounded-2xl border border-slate-700 shadow-md">
                <h3 className="text-slate-400 text-sm font-medium">Chat Sessions</h3>
                <p className="text-3xl font-bold text-purple-400 mt-2">12</p>
              </div>
            </div>

            <div className="bg-[#1E293B] p-6 rounded-2xl border border-slate-700 shadow-md h-80 flex flex-col">
              <h3 className="text-lg font-bold text-white mb-6">Mood Overview (This Week)</h3>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moodData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="day" stroke="#94A3B8" axisLine={false} tickLine={false} />
                    <YAxis stroke="#94A3B8" axisLine={false} tickLine={false} domain={[0, 10]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Line type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={4} dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* AI Chatbot পেজ */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="px-8 py-6 border-b border-slate-700 bg-[#1E293B] shrink-0">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Bot className="text-blue-500" size={28} /> Counselor Agent
              </h2>
              <p className="text-slate-400 text-sm mt-1">Your empathetic AI companion. Safe, private, and always here to listen.</p>
            </div>

            {/* ডায়নামিক চ্যাট মেসেজ এরিয়া */}
            <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-6">
              {messages.map((msg, index) => (
                <div key={index} className={`flex gap-4 max-w-[80%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.sender === 'user' ? 'bg-teal-500' : 'bg-blue-600'}`}>
                    {msg.sender === 'user' ? <User size={20} className="text-white" /> : <Bot size={20} className="text-white" />}
                  </div>
                  <div className={`p-4 rounded-2xl shadow-md ${msg.sender === 'user' ? 'bg-blue-600 rounded-tr-none text-white' : 'bg-[#1E293B] border border-slate-700 rounded-tl-none text-slate-200'}`}>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
              
              {/* লোডিং অ্যানিমেশন (যখন AI ভাবছে) */}
              {isLoading && (
                <div className="flex gap-4 max-w-[80%]">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0 shadow-lg">
                    <Bot size={20} className="text-white" />
                  </div>
                  <div className="bg-[#1E293B] border border-slate-700 p-4 rounded-2xl rounded-tl-none shadow-md flex items-center gap-2">
                    <Loader2 size={20} className="text-blue-500 animate-spin" />
                    <p className="text-slate-400 text-sm italic">Agent is typing...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Area */}
            <div className="p-6 bg-[#1E293B] border-t border-slate-700 shrink-0">
              <div className="max-w-4xl mx-auto flex items-center gap-4 bg-[#0F172A] p-2 rounded-full border border-slate-600 focus-within:border-blue-500 transition-colors shadow-inner">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message here... (Press Enter to send)" 
                  className="flex-1 bg-transparent border-none outline-none text-white px-4 py-2 placeholder-slate-500"
                  disabled={isLoading}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all shadow-lg shrink-0 group"
                >
                  <Send size={20} className="text-white ml-1 group-hover:scale-110 transition-transform" />
                </button>
              </div>
              <p className="text-center text-xs text-slate-500 mt-4">HealthCatch AI is an emotional support tool, not a substitute for clinical diagnosis or therapy.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;