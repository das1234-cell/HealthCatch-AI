import { auth, provider } from './firebase';
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  signOut
} from 'firebase/auth';
import Spline from '@splinetool/react-spline';
import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  LayoutDashboard, MessageSquare, HeartPulse, ClipboardList, 
  BrainCircuit, Send, User, Bot, Loader2, 
  Book, History, BarChart2, BookOpen, Settings, LogOut, Search, Sun, Bell, Paperclip, Mail, Lock, Calendar, Users, CheckCircle
} from 'lucide-react';

const BackgroundStyles = () => (
  <style>{`
    @keyframes blob {
      0% { transform: translate(0px, 0px) scale(1); }
      33% { transform: translate(30px, -50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
    .animate-blob { animation: blob 7s infinite; }
    .animation-delay-2000 { animation-delay: 2s; }
    .animation-delay-4000 { animation-delay: 4s; }
    
    /* Date picker icon color fix for dark mode */
    ::-webkit-calendar-picker-indicator {
        filter: invert(1);
        cursor: pointer;
    }
  `}</style>
);

const moodData = [
  { day: 'Mon', score: 4 }, { day: 'Tue', score: 6 }, { day: 'Wed', score: 5 },
  { day: 'Thu', score: 8 }, { day: 'Fri', score: 7 }, { day: 'Sat', score: 9 }, { day: 'Sun', score: 7.2 },
];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // 🔴 Auth States
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [authError, setAuthError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Chat States
  const [messages, setMessages] = useState([
    { sender: 'ai', text: "Hello there! I'm your HealthCatch AI Counselor. How are you feeling today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (activeTab === 'chat' && isLoggedIn) {
      inputRef.current?.focus();
    }
  }, [messages, isLoading, activeTab, isLoggedIn]);

  const handleSendMessage = async () => {
    if (!input.trim() && !selectedFile) return;

    const userMessage = { sender: 'user', text: input || (selectedFile ? `Uploaded a file: ${selectedFile.name}` : '') };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setIsLoading(true);

    const formData = new FormData();
    formData.append("message", input);
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    setInput('');
    setSelectedFile(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        body: formData, 
      });
      const data = await response.json();
      setMessages([...newMessages, { sender: 'ai', text: data.reply }]);
    } catch (error) {
      setMessages([...newMessages, { sender: 'ai', text: "Sorry, network issue." }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // --------------------------------------------------------
  // 🔴 Auth Logic (Login, SignUp, Email Verification)
  // --------------------------------------------------------
  if (!isLoggedIn) {

    const handleGoogleLogin = async () => {
      try {
        setAuthError('');
        setSuccessMsg('');
        const result = await signInWithPopup(auth, provider);
        console.log("Welcome:", result.user.displayName);
        setIsLoggedIn(true);
      } catch (error) {
        setAuthError("Google Login Failed! Please try again.");
      }
    };

    const handleAuthSubmit = async (e) => {
      e.preventDefault(); // ফর্ম রিলোড বন্ধ করা
      setAuthError('');
      setSuccessMsg('');
      setIsAuthLoading(true);

      try {
        if (isLoginMode) {
          // 🟢 LOGIN LOGIC
          if (!email || !password) throw new Error("Please enter email and password.");
          
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          
          // ইমেইল ভেরিফাই করা আছে কি না চেক করা
          if (!userCredential.user.emailVerified) {
            await signOut(auth); // ভেরিফাই না থাকলে লগআউট করে দাও
            throw new Error("Please verify your email first! Check your inbox.");
          }
          
          setIsLoggedIn(true);

        } else {
          // 🟢 SIGN UP LOGIC
          if (!fullName || !dob || !gender || !email || !password || !confirmPassword) {
            throw new Error("Please fill in all fields.");
          }
          if (password !== confirmPassword) {
            throw new Error("Passwords do not match!");
          }
          if (password.length < 6) {
            throw new Error("Password should be at least 6 characters.");
          }

          // ১. একাউন্ট তৈরি
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;

          // ২. প্রোফাইলে নাম সেট করা
          await updateProfile(user, { displayName: fullName });

          // ৩. ভেরিফিকেশন ইমেইল পাঠানো
          await sendEmailVerification(user);

          // ৪. সিকিউরিটির জন্য লগআউট করে দেওয়া (ভেরিফাই না করা পর্যন্ত ঢুকতে পারবে না)
          await signOut(auth);

          // ৫. ফর্ম ক্লিয়ার করে লগইন পেজে পাঠানো এবং মেসেজ দেখানো
          setSuccessMsg("Account created successfully! A verification email has been sent to your inbox. Please verify before logging in.");
          setIsLoginMode(true);
          setPassword('');
          setConfirmPassword('');
        }
      } catch (error) {
        setAuthError(error.message.replace("Firebase: ", "").replace("Error (auth/", "").replace(").", ""));
      } finally {
        setIsAuthLoading(false);
      }
    };

    const toggleMode = () => {
      setIsLoginMode(!isLoginMode);
      setAuthError('');
      setSuccessMsg('');
      setPassword('');
      setConfirmPassword('');
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A] relative overflow-hidden font-sans">
        <BackgroundStyles />
        
        {/* 3D Background */}
        <div className="absolute inset-0 z-0">
          <Spline scene="https://prod.spline.design/a3DWoWJ74evdsc1n/scene.splinecode" />
        </div>
        <div className="absolute inset-0 bg-[#0F172A]/40 z-0 pointer-events-none"></div>

        {/* Glassmorphism Login Box */}
        <div className="w-full max-w-lg bg-[#1E293B]/70 backdrop-blur-2xl p-8 rounded-3xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.7)] z-10 relative my-8">
          <div className="flex justify-center mb-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3 drop-shadow-md">
              <BrainCircuit size={40} className="text-blue-400" /> HealthCatch
            </h1>
          </div>
          
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            {isLoginMode ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="text-slate-300 text-center mb-6">
            {isLoginMode ? 'Sign in to access your AI mental wellness companion.' : 'Provide your details to start your wellness journey.'}
          </p>

          {/* Alerts */}
          {authError && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-xl mb-4 text-sm text-center font-medium animate-pulse">
              {authError}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-200 p-3 rounded-xl mb-4 text-sm text-center font-medium flex items-center justify-center gap-2">
              <CheckCircle size={18} /> {successMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            
            {!isLoginMode && (
              <>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={20} />
                  <input 
                    type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#0F172A]/80 border border-slate-500/50 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-blue-400 transition-all shadow-inner" 
                  />
                </div>

                <div className="flex gap-4">
                  <div className="relative group w-1/2">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors z-10" size={20} />
                    <input 
                      type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-[#0F172A]/80 border border-slate-500/50 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-blue-400 transition-all shadow-inner" 
                    />
                  </div>
                  <div className="relative group w-1/2">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors z-10" size={20} />
                    <select 
                      value={gender} onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-[#0F172A]/80 border border-slate-500/50 text-white rounded-xl py-3 pl-12 pr-4 appearance-none focus:outline-none focus:border-blue-400 transition-all shadow-inner"
                    >
                      <option value="" disabled className="text-slate-500">Gender</option>
                      <option value="male" className="bg-[#1E293B]">Male</option>
                      <option value="female" className="bg-[#1E293B]">Female</option>
                      <option value="other" className="bg-[#1E293B]">Other</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={20} />
              <input 
                type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0F172A]/80 border border-slate-500/50 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-blue-400 transition-all shadow-inner" 
              />
            </div>
            
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={20} />
              <input 
                type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0F172A]/80 border border-slate-500/50 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-blue-400 transition-all shadow-inner" 
              />
            </div>

            {!isLoginMode && (
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={20} />
                <input 
                  type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#0F172A]/80 border border-slate-500/50 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-blue-400 transition-all shadow-inner" 
                />
              </div>
            )}

            <button 
              type="submit"
              disabled={isAuthLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isAuthLoading ? 'Processing...' : (isLoginMode ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-slate-500/50"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">or</span>
            <div className="flex-grow border-t border-slate-500/50"></div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all border border-white/20 backdrop-blur-md flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 drop-shadow-md" />
            Continue with Google
          </button>

          <p className="text-center text-slate-300 mt-6 text-sm">
            {isLoginMode ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={toggleMode} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              {isLoginMode ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------
  // 🔴 মেইন অ্যাপ (লগইন করার পর)
  // --------------------------------------------------------
  return (
    <div className="flex h-screen bg-[#0F172A] text-white font-sans overflow-hidden">
      
      <div className="w-64 bg-[#1E293B] flex flex-col border-r border-slate-700 shadow-xl z-10">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-500 mb-8 flex items-center gap-3">
            <BrainCircuit size={32} /> HealthCatch 
          </h1>
          
          <div className="flex flex-col gap-2">
            <SidebarBtn icon={<LayoutDashboard size={20}/>} label="Dashboard" tab="dashboard" active={activeTab} set={setActiveTab} />
            <SidebarBtn icon={<MessageSquare size={20}/>} label="AI Chatbot" tab="chat" active={activeTab} set={setActiveTab} />
            <SidebarBtn icon={<HeartPulse size={20}/>} label="Mood Tracker" tab="mood" active={activeTab} set={setActiveTab} />
            <SidebarBtn icon={<ClipboardList size={20}/>} label="Assessments" tab="assessments" active={activeTab} set={setActiveTab} />
            <SidebarBtn icon={<Book size={20}/>} label="Journal" tab="journal" active={activeTab} set={setActiveTab} />
            <SidebarBtn icon={<History size={20}/>} label="History" tab="history" active={activeTab} set={setActiveTab} />
            <SidebarBtn icon={<BarChart2 size={20}/>} label="Analytics" tab="analytics" active={activeTab} set={setActiveTab} />
            <SidebarBtn icon={<BookOpen size={20}/>} label="Resources" tab="resources" active={activeTab} set={setActiveTab} />
            <SidebarBtn icon={<Settings size={20}/>} label="Settings" tab="settings" active={activeTab} set={setActiveTab} />
          </div>
        </div>
        
        <div className="mt-auto p-6 border-t border-slate-700">
          <button 
            onClick={() => setIsLoggedIn(false)} 
            className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-red-500/10 hover:text-red-400 rounded-xl text-slate-400 transition-all"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full bg-[#0F172A]">
        <div className="h-20 border-b border-slate-700 flex items-center justify-between px-8 bg-[#1E293B]/50">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder="Search..." className="w-full bg-[#0F172A] border border-slate-600 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 text-white" />
          </div>
          <div className="flex items-center gap-6">
            <button className="text-slate-400 hover:text-white transition-colors"><Sun size={24} /></button>
            <button className="text-slate-400 hover:text-white transition-colors relative">
              <Bell size={24} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-slate-600 border-2 border-blue-500 overflow-hidden cursor-pointer" onClick={() => setActiveTab('profile')}>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Subham" alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          
          {activeTab === 'dashboard' && (
            <div className="p-10 h-full overflow-y-auto">
              <h2 className="text-3xl font-bold mb-2 text-white">Welcome back! 👋</h2>
              <p className="text-slate-400 mb-10">Here is your mental wellness summary for this week.</p>
              
              <div className="flex gap-6 mb-8">
                <StatCard title="Mood This Week" value="7.2 / 10" color="text-green-400" />
                <StatCard title="Assessments" value="3" color="text-blue-400" />
                <StatCard title="Chat Sessions" value="12" color="text-purple-400" />
                <StatCard title="Journal Entries" value="8" color="text-yellow-400" />
              </div>

              <div className="bg-[#1E293B] p-6 rounded-2xl border border-slate-700 shadow-md h-80 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-6">Mood Overview (This Week)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moodData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="day" stroke="#94A3B8" axisLine={false} tickLine={false} />
                    <YAxis stroke="#94A3B8" axisLine={false} tickLine={false} domain={[0, 10]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Line type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={4} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
             <div className="flex flex-col h-full">
               <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-6">
                 {messages.map((msg, index) => (
                   <div key={index} className={`flex gap-4 max-w-[80%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : ''}`}>
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.sender === 'user' ? 'bg-teal-500' : 'bg-blue-600'}`}>
                       {msg.sender === 'user' ? <User size={20} /> : <Bot size={20} />}
                     </div>
                     <div className={`p-4 rounded-2xl shadow-md ${msg.sender === 'user' ? 'bg-blue-600 rounded-tr-none text-white' : 'bg-[#1E293B] border border-slate-700 rounded-tl-none text-slate-200'}`}>
                       <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                     </div>
                   </div>
                 ))}
                 {isLoading && (
                   <div className="flex gap-4 max-w-[80%]">
                     <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center"><Bot size={20} /></div>
                     <div className="bg-[#1E293B] border border-slate-700 p-4 rounded-2xl rounded-tl-none shadow-md flex items-center gap-2">
                       <Loader2 size={20} className="text-blue-500 animate-spin" />
                     </div>
                   </div>
                 )}
                 <div ref={messagesEndRef} />
               </div>
               
               <div className="p-6 bg-[#1E293B] border-t border-slate-700 shrink-0">
                 
                 {selectedFile && (
                   <div className="max-w-4xl mx-auto mb-2 bg-[#0F172A] p-2 rounded-lg border border-slate-600 flex items-center justify-between">
                     <span className="text-sm text-blue-400 flex items-center gap-2">
                       <Paperclip size={16} /> {selectedFile.name}
                     </span>
                     <button onClick={() => setSelectedFile(null)} className="text-red-400 hover:text-red-300 text-xs font-bold px-2">✕</button>
                   </div>
                 )}

                 <div className="max-w-4xl mx-auto flex items-center gap-3 bg-[#0F172A] p-2 rounded-full border border-slate-600 focus-within:border-blue-500">
                   
                   <input 
                     type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf, image/*" 
                   />
                   <button onClick={() => fileInputRef.current.click()} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-[#1E293B] transition-colors shrink-0">
                     <Paperclip size={20} />
                   </button>
                   <input 
                     ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                     placeholder="Type a message or describe your prescription..." className="flex-1 bg-transparent border-none outline-none text-white px-2 py-2"
                   />
                   <button onClick={handleSendMessage} disabled={isLoading || (!input.trim() && !selectedFile)} className="w-12 h-12 bg-blue-600 rounded-full flex justify-center items-center hover:bg-blue-500 transition-colors disabled:bg-slate-700">
                     <Send size={20} className="ml-1" />
                   </button>
                 </div>
               </div>
             </div>
          )}

          {['mood', 'assessments', 'journal', 'history', 'analytics', 'resources', 'settings', 'profile'].includes(activeTab) && (
            <div className="p-10 flex flex-col items-center justify-center h-full text-center">
              <h2 className="text-4xl font-bold text-slate-300 capitalize mb-4">{activeTab} Page</h2>
              <p className="text-slate-500 text-lg max-w-lg">
                This section is under construction.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const SidebarBtn = ({ icon, label, tab, active, set }) => (
  <button 
    onClick={() => set(tab)} 
    className={`flex items-center gap-3 text-left px-4 py-3 rounded-xl font-medium transition-all ${active === tab ? 'bg-blue-600 shadow-lg text-white' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}
  >
    {icon} {label}
  </button>
);

const StatCard = ({ title, value, color }) => (
  <div className="flex-1 bg-[#1E293B] p-6 rounded-2xl border border-slate-700 shadow-md">
    <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
    <p className={`text-3xl font-bold ${color} mt-2`}>{value}</p>
  </div>
);

export default App;