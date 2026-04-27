'use client'

import { translations, type Language } from '@/lib/translations'
import { useState, useRef, useEffect } from 'react'
import { askCardExpert } from '@/lib/actions'
import { supabase, signInWithGoogle, signOut } from '@/lib/auth'
import ReactMarkdown from 'react-markdown'
import { 
  Send, Bot, CreditCard, Sparkles, 
  Landmark, LogIn, X, LogOut, MapPin, 
  ShoppingBag, ChevronRight, Briefcase,
  CheckCircle2, AlertCircle, Zap,
  UserCircle, User, Loader2
} from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  tier?: 'VIP' | 'BASIC' | 'GUEST';
  showDetailButton?: boolean; // NEW
  suggestions?: string[];      // NEW
  applicationUrl?: string; // Add this line
}

interface UserProfile {
  fullName: string;
  income: string;
  residencyStatus: string; 
  primarySpend: string; 
  occupation: string;
  employment_type: string; 
  ownedCards: string[]; 
  primaryBank: string;      // NEW
  bankProducts: string[];   // NEW
  language: 'en' | 'zh' | 'cn';
}

export default function HomePage() {
  // Inside HomePage component
  const [lang, setLang] = useState<Language>('en')
  //const [lang, setLang] = useState<'en' | 'zh' | 'cn'>('en')
  const t = translations[lang] || translations['en']
  
  const [question, setQuestion] = useState('')
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    fullName: '', income: '', residencyStatus: '', 
    primarySpend: '', occupation: '', employment_type: 'Full-time', 
    ownedCards: [], primaryBank: '', bankProducts: [], language: 'en'
  })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Validation Logic - Includes the new bank/product requirements
  const isProfileComplete = Boolean(
    userProfile.income && 
    userProfile.occupation && 
    userProfile.residencyStatus && 
    userProfile.primaryBank &&
    (userProfile.primarySpend && userProfile.primarySpend.length > 0) &&
    // If they have a bank, they should select at least one product OR "Credit Card"
    (userProfile.primaryBank.includes('None') || userProfile.primaryBank.includes('沒有') || (userProfile.bankProducts && userProfile.bankProducts.length > 0))
  );

  const userTier = !user ? 'GUEST' : isProfileComplete ? 'VIP' : 'BASIC';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [history, loading])

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        if (profile) {
          setUserProfile({
            fullName: profile.full_name || '',
            income: profile.income || '',
            residencyStatus: profile.residency_status || '',
            occupation: profile.occupation || '',
            employment_type: profile.employment_type || 'Full-time',
            ownedCards: profile.owned_cards || [],
            primaryBank: profile.primary_bank || '',         // FROM SUPABASE
            bankProducts: profile.bank_products || [],       // FROM SUPABASE
            language: (profile.preferred_language as any) || 'en',
            primarySpend: profile.primary_spend || ''
          })
          setLang((profile.preferred_language as any) || 'en')
        }
      }
    }
    checkUser()
  }, [])

  const handleUserHubClick = () => {
    if (!user) signInWithGoogle()
    else setIsProfileOpen(true)
  }

  const handleLogout = async () => {
    await signOut()
    window.location.reload()
  }

  const saveProfile = async () => {
    if (!user || !isProfileComplete) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: userProfile.fullName,
        income: userProfile.income,
        residency_status: userProfile.residencyStatus,
        primary_spend: userProfile.primarySpend,
        occupation: userProfile.occupation,
        employment_type: userProfile.employment_type, 
        owned_cards: userProfile.ownedCards,
        primary_bank: userProfile.primaryBank,     // SAVE NEW FIELD
        bank_products: userProfile.bankProducts,   // SAVE NEW FIELD
        preferred_language: lang,
        updated_at: new Date().toISOString(),
      });
      if (error) alert(error.message);
      else setIsProfileOpen(false);
    } catch (err) { console.error(err); } 
    finally { setIsSaving(false); }
  };

  const sendMessage = async (text: string) => {
    // 1. Basic validation and UI prep
    if (!text.trim() || loading) return;
    
    // 2. Add the user's message to history and start loading
    setHistory(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    setQuestion(''); // Clear the input field
    
    try {
      // 3. Determine if user is VIP to select the correct AI Model
      const isVipUser = userTier === 'VIP'; 
      
      // 4. Call the Server Action (lib/actions.ts)
      //const result = await askCardExpert(text, isVipUser);

      // Inside sendMessage in page.tsx
      const result = await askCardExpert(text, isVipUser, lang);
      console.log("Debug Result:", result); // Check if applicationUrl is coming back as null or a string
      
      if (!result || !result.success) {
        throw new Error(result?.error || "Empty response from AI engine");
      }

      // 5. Clean the response (remove any hidden <think> tags if present)
      let cleanAnswer = result.answer.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

      if (!cleanAnswer) {
        cleanAnswer = "I'm sorry, I encountered a formatting error. Please try asking again.";
      }

      // 6. Update history with the AI response + Dynamic Suggestions
      setHistory(prev => [...prev, { 
        role: 'ai', 
        content: cleanAnswer, 
        tier: userTier as any,
        showDetailButton: true,              // Enable the "Want details" button
        suggestions: result.suggestions || [], // Map the dynamic suggestions from the AI
        applicationUrl: result.applicationUrl
      }]);

    } catch (err) {
      console.error("❌ Chat error:", err);
      setHistory(prev => [...prev, { 
        role: 'ai', 
        content: lang === 'en' 
          ? "System connection error. Please try again later." 
          : "系統連線錯誤，請稍後再試。" 
      }]);
    } finally { 
      // 7. Stop the loading state
      setLoading(false);
    }
  }

  return (
    <div className="h-dvh bg-slate-50 text-slate-900 flex flex-col relative font-sans overflow-hidden">
      {/* HEADER */}
      <header className="shrink-0 bg-white border-b px-4 sm:px-6 py-3 z-[100] shadow-sm pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <div className="max-w-5xl mx-auto flex items-center justify-between relative">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-sm">
              <CreditCard className="text-white w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-lg font-black tracking-tight leading-none text-slate-900">
                SolutionTeamX
              </h1>
              {/* REPLACED "Card Rebate" with "AI REBATE HUNTER" */}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] sm:text-xs text-indigo-600 font-black uppercase tracking-[0.1em] block">
                  {t.headerLabel}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 relative">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {['en', 'zh', 'cn'].map((id) => (
                <button 
                  key={id} 
                  onClick={() => setLang(id as any)}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-black rounded-md transition-all ${
                    lang === id ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {id === 'en' ? 'ENG' : id === 'zh' ? '繁' : '簡'}
                </button>
              ))}
            </div>

            <div className="relative flex items-center">
              <button 
                onClick={handleUserHubClick} 
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition-all shadow-md active:scale-95 border ${
                  user ? 'bg-white border-indigo-100 text-indigo-600' : 'bg-indigo-600 border-indigo-600 text-white'
                }`}
              >
                {user ? (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                    {user.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} alt="avatar" /> : <User className="w-4 h-4" />}
                  </div>
                ) : <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />}
                <span className="hidden xs:inline">{user ? (userProfile.fullName || t.profile) : t.login}</span>
              </button>

              {/* TOOLTIP */}
              {userTier !== 'VIP' && (
                <div className="absolute top-full right-0 mt-3 md:mt-0 md:top-1/2 md:-translate-y-1/2 md:right-auto md:left-full md:ml-4 w-44 md:w-52 
                  bg-indigo-600/80 backdrop-blur-md text-white text-[11px] sm:text-xs font-bold p-3 rounded-xl shadow-xl z-[200]
                  animate-pulse-slow
                  before:content-[''] before:absolute before:-top-1.5 before:right-6 md:before:top-1/2 md:before:-translate-y-1/2 md:before:-left-1.5 md:before:right-auto before:w-3 before:h-3 before:bg-indigo-600/80 before:rotate-45">
                  {userTier === 'GUEST' ? t.nudgeGuest : t.nudgeBasic}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* CHAT AREA */}
      <main className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto p-4 sm:p-6 [&::-webkit-scrollbar]:hidden">
        {history.length === 0 && !loading && (
          <div className="min-h-full flex flex-col justify-center items-center text-center py-10 animate-in fade-in zoom-in duration-500">
             <h2 className="text-4xl sm:text-6xl font-black mb-4 tracking-tighter text-slate-900 leading-tight">{t.title}</h2>
             <p className="text-slate-500 text-base sm:text-lg mb-10 max-w-lg font-medium leading-relaxed">{t.subtitle}</p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {t.quickTips.map((q: string) => (
                  <button 
                    key={q} onClick={() => sendMessage(q)} 
                    className="bg-white border-2 border-slate-100 p-4 sm:p-5 rounded-2xl text-sm sm:text-base font-bold text-slate-700 hover:border-indigo-400 active:bg-indigo-50 transition-all text-left flex justify-between items-center group"
                  >
                    {q} <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-transform" />
                  </button>
                ))}
             </div>
          </div>
        )}

        <div className="space-y-6">
          {history.map((chat, i) => (
            <div key={i} className={`flex w-full gap-3 ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              {/* AI ICON (Left side for AI responses) */}
              {chat.role === 'ai' && (
                <div className="shrink-0 mt-1">
                  <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm">
                    <Bot className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
              )}

              <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${chat.role === 'user' ? 'items-end' : 'items-start'}`}>
                {chat.role === 'ai' && (
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter mb-1 ml-1">
                    {chat.tier === 'VIP' ? 'VIP AI' : chat.tier === 'BASIC' ? 'Basic AI' : 'Guest AI'}
                  </span>
                )}

                <div className={`p-4 sm:p-5 rounded-2xl border ${
                  chat.role === 'user' 
                    ? 'bg-slate-900 text-white border-slate-800 rounded-tr-none' 
                    : 'bg-white text-slate-800 border-slate-100 shadow-sm rounded-tl-none'
                }`}>
                  <div className="text-sm sm:text-base prose prose-sm sm:prose-base max-w-none prose-slate">
                    <ReactMarkdown>{chat.content}</ReactMarkdown>
                  </div>
                </div>

                {/* --- 2. DYNAMIC FOLLOW-UP CHIPS (Below the bubble) --- */}
                {chat.role === 'ai' && chat.suggestions && chat.suggestions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2">
                    {chat.suggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          // Clear suggestions so they don't stay on screen after clicking
                          const newHistory = [...history];
                          newHistory[i].suggestions = []; 
                          setHistory(newHistory);
                          sendMessage(sug);
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[11px] font-bold text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-1.5 active:scale-95 group"
                      >
                        <Zap className="w-3 h-3 text-indigo-400 group-hover:text-indigo-600" />
                        {sug}
                      </button>
                    ))}
                  </div>
                )}

                {/* 2. Show the Apply Button ONLY if a URL exists */}
              {chat.role === 'ai' && chat.applicationUrl && (
                <div className="mt-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <a
                    href={chat.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 text-white rounded-2xl shadow-[0_10px_20px_rgba(244,63,94,0.3)] hover:shadow-[0_15px_30px_rgba(244,63,94,0.4)] hover:-translate-y-1 active:scale-95 transition-all duration-300"
                  >
                    {/* Sparkle Icon */}
                    <div className="bg-white/20 p-1.5 rounded-lg">
                      <Zap className="w-4 h-4 fill-white" />
                    </div>
                    
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Limited Time Offer</span>
                      <span className="text-sm sm:text-base font-black">
                        {lang === 'en' ? 'Apply Now & Claim Rewards' : '立即申請並領取獎賞'}
                      </span>
                    </div>

                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    
                    {/* Subtle Glow Effect */}
                    <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                  </a>
                  
                  <p className="mt-3 ml-1 text-[10px] text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-tighter">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    {lang === 'en' ? 'Official Bank Application Secure Link' : '銀行官方申請安全連結'}
                  </p>
                </div>
              )}
              </div>

              {/* USER AVATAR (Right side for User messages) */}
              {chat.role === 'user' && (
                <div className="shrink-0 mt-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                    {user?.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="user" className="w-full h-full object-cover" />
                    ) : (
                      <User className="text-slate-500 w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center px-2">
              <div className="bg-slate-100 p-1.5 rounded-lg animate-pulse">
                <Bot className="text-slate-400 w-4 h-4 sm:w-5 sm:h-5"/>
              </div>
              <div className="text-xs sm:text-sm text-slate-400 font-bold animate-pulse">
                {t.thinking}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      {/* INPUT AREA */}
      <footer className="shrink-0 bg-white border-t p-3 sm:p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-50 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="max-w-4xl mx-auto">
          <div className="relative mb-2">
            <input 
              type="text" placeholder={t.placeholder} 
              className="w-full bg-slate-100 rounded-2xl px-4 py-4 sm:py-5 pr-14 sm:pr-16 outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base font-medium" 
              value={question} onChange={(e) => setQuestion(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(question)}
            />
            <button 
              onClick={() => sendMessage(question)} 
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-2.5 sm:p-3 rounded-xl shadow-md active:scale-95"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          <div className="flex justify-center text-[10px] sm:text-xs text-slate-500 font-medium px-2 text-center">
            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-600 shrink-0"/> {t.disclaimer}</span>
          </div>
        </div>
      </footer>

      {/* PROFILE SIDEBAR */}
      {isProfileOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200]" onClick={() => setIsProfileOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-xs sm:max-w-sm bg-white shadow-2xl z-[210] p-6 flex flex-col animate-in slide-in-from-right">
            <div className="flex justify-between items-center mb-6 border-b pb-4 shrink-0">
              <h3 className="text-lg font-black uppercase tracking-tight">{t.profile}</h3>
              <div className="flex gap-2">
                 <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><LogOut className="w-5 h-5"/></button>
                 <button onClick={() => setIsProfileOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
            </div>
            
            <div className="space-y-6 flex-1 overflow-y-auto pr-2 pb-6 [&::-webkit-scrollbar]:hidden">
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 items-center">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-xs font-bold text-amber-900 m-0 leading-tight">{t.requiredNote}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <UserCircle className="w-3 h-3"/> {t.fullNameLabel}
                </label>
                <input 
                  type="text" placeholder={t.fullNamePlaceholder} value={userProfile.fullName} 
                  onChange={(e) => setUserProfile({...userProfile, fullName: e.target.value})} 
                  className="w-full p-3.5 bg-slate-50 border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                  <Landmark className="w-3 h-3"/> {t.incomeLabel} *
                </label>
                <select 
                  value={userProfile.income} onChange={(e) => setUserProfile({...userProfile, income: e.target.value})} 
                  className="w-full p-3.5 bg-slate-50 border rounded-xl text-sm font-bold outline-none cursor-pointer"
                >
                  <option value="">{t.selectRange}</option>
                  <option value="Below $200k">{t.incomes.range1}</option>
                  <option value="$200k-$400k">{t.incomes.range2}</option>
                  <option value="$400k-$600k">{t.incomes.range3}</option>
                  <option value="Above $600k">{t.incomes.range4}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                  <Briefcase className="w-3 h-3"/> {t.sector} *
                </label>
                <select 
                  value={userProfile.occupation} onChange={(e) => setUserProfile({...userProfile, occupation: e.target.value})} 
                  className="w-full p-3.5 bg-slate-50 border rounded-xl text-sm font-bold outline-none cursor-pointer"
                >
                  <option value="">{t.sector}</option>
                  {Object.entries(t.sectors).map(([key, val]) => (<option key={key} value={key}>{val as string}</option>))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                  <MapPin className="w-3 h-3"/> {t.residency} *
                </label>
                <select 
                  value={userProfile.residencyStatus} onChange={(e) => setUserProfile({...userProfile, residencyStatus: e.target.value})} 
                  className="w-full p-3.5 bg-slate-50 border rounded-xl text-sm font-bold outline-none cursor-pointer"
                >
                  <option value="">{t.residency}</option>
                  <option value="Permanent">{t.residencies.permanent}</option>
                  <option value="Non-Resident-CN">{t.residencies.nonResidentCN}</option>
                  <option value="Talent">{t.residencies.talent}</option>
                  <option value="Student">{t.residencies.student}</option>
                </select>
              </div>

              {/* TWO-STEP BANKING RELATIONSHIP */}
              <div className="space-y-1.5 pt-2 border-t">
                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                  <Landmark className="w-3 h-3"/> {t.primaryBankLabel} *
                </label>
                <select 
                  value={userProfile.primaryBank} 
                  onChange={(e) => setUserProfile({...userProfile, primaryBank: e.target.value, bankProducts: []})} 
                  className="w-full p-3.5 bg-slate-50 border rounded-xl text-sm font-bold outline-none cursor-pointer"
                >
                  <option value="">{t.primaryBankPlaceholder}</option>
                  {t.banks.map((bank: string) => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>

              {userProfile.primaryBank && !userProfile.primaryBank.includes('None') && !userProfile.primaryBank.includes('沒有') && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3 h-3"/> {t.bankProductsLabel} *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(t.productsList).map(([key, label]) => {
                      const isSelected = (userProfile.bankProducts || []).includes(key);
                      return (
                        <button 
                          key={key} type="button" 
                          onClick={() => {
                            const current = userProfile.bankProducts || [];
                            const next = isSelected ? current.filter(p => p !== key) : [...current, key];
                            setUserProfile({...userProfile, bankProducts: next});
                          }}
                          className={`px-3 py-2 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1 ${
                            isSelected 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3" />}
                          {label as string}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                  <ShoppingBag className="w-3 h-3"/> {t.goals} *
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Dining', 'Travel', 'Online', 'Insurance', 'Supermarket'].map(goal => (
                    <button 
                      key={goal} type="button" 
                      onClick={() => {
                        const current = (userProfile.primarySpend || '').split(',').filter(Boolean);
                        const next = current.includes(goal) ? current.filter(g => g !== goal) : [...current, goal];
                        setUserProfile({...userProfile, primarySpend: next.join(',')});
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${
                        (userProfile.primarySpend || '').includes(goal) 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      {(userProfile.primarySpend || '').includes(goal) && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {t.goalsList[goal]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <button 
              onClick={saveProfile} 
              disabled={!isProfileComplete || isSaving} 
              className={`w-full mt-4 shrink-0 py-4 rounded-2xl font-black text-xs shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] uppercase tracking-tighter ${
                isProfileComplete 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />} 
              {isSaving ? t.saving : (isProfileComplete ? t.save : t.completeRequired)}
            </button>
          </div>
        </>
      )}
    </div>
  )
}