'use client'

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

// --- TRANSLATIONS ---
const translations: any = {
  en: {
    title: "Max Your Rebates.",
    subtitle: "Unlock the ultimate credit card strategy with our AI-powered engine. Compare, optimize, and earn more on every dollar.",
    login: "Sign In",
    logout: "Sign Out",
    profile: "User Profile",
    nudgeGuest: "Log in & complete profile to unlock faster AI responses!",
    nudgeBasic: "Complete your profile to unlock faster AI responses!",
    placeholder: "Ask about HSBC cards or eligibility...",
    thinking: "AI Engine Analyzing...",
    save: "SAVE & UNLOCK PAID AI",
    saving: "SAVING PROFILE...",
    requiredNote: "* All fields except Name are required to unlock VIP Tier.",
    completeRequired: "Complete Required Fields",
    sector: "Occupation / Job Category",
    residency: "Residency Status",
    goals: "Spending Goals (Select All)",
    relationship: "Banking Relationship",
    disclaimer: "AI-generated advice may be inaccurate. Always verify with the bank's latest Key Fact Statement (KFS).",
    profileRemark: "Complete profile for high-speed VIP AI & personalized analysis.",
    quickTips: ["Best card for iPhone?", "Fastest Asia Miles?", "Top card for China?", "Welcome Offers?"],
    fullNameLabel: "Full Name (Optional)",
    fullNamePlaceholder: "e.g. Tommy Leung",
    incomeLabel: "Annual Income (HKD)",
    selectRange: "Select Range",
    incomes: {
      range1: "Below $200,000",
      range2: "$200,000 - $400,000",
      range3: "$400,000 - $600,000",
      range4: "Above $600,000"
    },
    residencies: {
      permanent: "HK Permanent Resident",
      nonResidentCN: "Non-Resident Chinese (Mainland)",
      talent: "Talent Visa (IANG/TTPS)",
      student: "Non-local Student"
    },
    goalsList: {
      Dining: "Dining",
      Travel: "Travel",
      Online: "Online",
      Insurance: "Insurance",
      Supermarket: "Supermarket"
    },
    relationsList: {
      'HSBC Payroll': "HSBC Payroll",
      'HSBC Mortgage': "HSBC Mortgage",
      'HSBC MPF': "HSBC MPF",
      'Existing Cardholder': "Existing Cardholder"
    },
    sectors: {
      Gov: "Government / Civil Servant",
      Edu: "Education / Teacher",
      Fin: "Banking & Finance",
      Med: "Medical / Professional",
      NGO: "NGO / Social Work",
      Self: "Self-Employed / Business Owner",
      Others: "Others / Private Sector"
    }
  },
  zh: {
    title: "賺盡回贈。",
    subtitle: "透過 AI 引擎制定最強信用卡策略。比較、優化、並在每一蚊消費賺取最高獎賞。",
    login: "登入",
    logout: "登出",
    profile: "個人檔案",
    nudgeGuest: "登入並填寫資料，獲取更快的 AI 解答！",
    nudgeBasic: "填寫資料，獲取更快的 AI 解答！",
    placeholder: "詢問關於滙豐信用卡或申請資格...",
    thinking: "AI 引擎正在分析...",
    save: "儲存並開啟 VIP AI",
    saving: "正在儲存...",
    requiredNote: "* 除姓名外，所有欄位均為必填，以解鎖 VIP 權限。",
    completeRequired: "請填寫所有必填欄位",
    sector: "職業 / 工作類別",
    residency: "居留身份",
    goals: "消費目標 (可多選)",
    relationship: "銀行往來關係",
    disclaimer: "AI 提供的建議僅供參考，或有偏差。請務必參閱銀行最新的服務條款及細則。",
    profileRemark: "填寫資料以解鎖高性能 VIP AI 及個人化分析。",
    quickTips: ["買 iPhone 用邊張卡？", "最快儲里數方法？", "內地消費最強卡？", "最新迎新優惠？"],
    fullNameLabel: "姓名 (選填)",
    fullNamePlaceholder: "例如：Tommy Leung",
    incomeLabel: "年收入 (HKD)",
    selectRange: "請選擇範圍",
    incomes: {
      range1: "$200,000 以下",
      range2: "$200,000 - $400,000",
      range3: "$400,000 - $600,000",
      range4: "$600,000 以上"
    },
    residencies: {
      permanent: "香港永久性居民",
      nonResidentCN: "非本地居民 (內地)",
      talent: "人才簽證 (IANG/高才通)",
      student: "非本地學生"
    },
    goalsList: {
      Dining: "餐飲",
      Travel: "旅遊",
      Online: "網購",
      Insurance: "保險",
      Supermarket: "超級市場"
    },
    relationsList: {
      'HSBC Payroll': "滙豐出糧戶口",
      'HSBC Mortgage': "滙豐按揭",
      'HSBC MPF': "滙豐強積金",
      'Existing Cardholder': "現有信用卡客戶"
    },
    sectors: {
      Gov: "政府人員 / 公務員",
      Edu: "教育界 / 教師",
      Fin: "銀行及金融業",
      Med: "醫療 / 專業人士",
      NGO: "非牟利機構 / 社工",
      Self: "自僱 / 營商",
      Others: "其他 / 私營機構"
    }
  },
  cn: {
    title: "賺盡回贈。",
    subtitle: "透過 AI 引擎制定最強信用卡策略。比較、優化、並在每一份消費賺取最高獎賞。",
    login: "登錄",
    logout: "登出",
    profile: "個人檔案",
    nudgeGuest: "登錄並填寫資料，獲取更快的 AI 解答！",
    nudgeBasic: "填寫個人資料，獲取更快的 AI 解答！",
    placeholder: "詢問關於滙豐信用卡或申請資格...",
    thinking: "AI 引擎正在分析...",
    save: "保存並開啟 VIP AI",
    saving: "正在儲存...",
    requiredNote: "* 除姓名外，所有字段均為必填，以解鎖 VIP 權限。",
    completeRequired: "請填寫所有必填字段",
    sector: "職業 / 工作類別",
    residency: "居留身份",
    goals: "消費目標 (可多選)",
    relationship: "銀行往來關係",
    disclaimer: "AI 提供的建議僅供參考，或有偏差。請務必參閱銀行最新的服務條款及細則。",
    profileRemark: "填寫資料以解鎖高性能 VIP AI 及個人化分析。",
    quickTips: ["買 iPhone 用哪張卡？", "最快攢里數方法？", "內地消費最強卡？", "最新迎新優惠？"],
    fullNameLabel: "姓名 (選填)",
    fullNamePlaceholder: "例如：Tommy Leung",
    incomeLabel: "年收入 (HKD)",
    selectRange: "請選擇範圍",
    incomes: {
      range1: "$200,000 以下",
      range2: "$200,000 - $400,000",
      range3: "$400,000 - $600,000",
      range4: "$600,000 以上"
    },
    residencies: {
      permanent: "香港永久性居民",
      nonResidentCN: "非本地居民 (內地)",
      talent: "人才簽證 (IANG/高才通)",
      student: "非本地學生"
    },
    goalsList: {
      Dining: "餐飲",
      Travel: "旅遊",
      Online: "網購",
      Insurance: "保險",
      Supermarket: "超市"
    },
    relationsList: {
      'HSBC Payroll': "匯豐代發工資賬戶",
      'HSBC Mortgage': "匯豐按揭",
      'HSBC MPF': "匯豐強積金",
      'Existing Cardholder': "現有信用卡客戶"
    },
    sectors: {
      Gov: "政府人員 / 公務員",
      Edu: "教育人員 / 教師",
      Fin: "銀行及金融業",
      Med: "醫療 / 專業人士",
      NGO: "非營利機構 / 社工",
      Self: "自雇 / 營商",
      Others: "其他 / 私營機構"
    }
  }
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  tier?: 'VIP' | 'BASIC' | 'GUEST'; 
}

interface UserProfile {
  fullName: string;
  income: string;
  residencyStatus: string; 
  primarySpend: string; 
  occupation: string;
  employment_type: string; 
  ownedCards: string[]; 
  language: 'en' | 'zh' | 'cn';
}

export default function HomePage() {
  const [lang, setLang] = useState<'en' | 'zh' | 'cn'>('en')
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
    ownedCards: [], language: 'en'
  })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Validation Logic
  const isProfileComplete = Boolean(
    userProfile.income && 
    userProfile.occupation && 
    userProfile.residencyStatus && 
    (userProfile.primarySpend && userProfile.primarySpend.length > 0) &&
    (userProfile.ownedCards && userProfile.ownedCards.length > 0)
  );

  // User Tier Logic
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
        preferred_language: lang,
        updated_at: new Date().toISOString(),
      });
      if (error) alert(error.message);
      else setIsProfileOpen(false);
    } catch (err) { console.error(err); } 
    finally { setIsSaving(false); }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    setHistory(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)
    setQuestion('')
    try {
      // Pass null profile if not VIP, triggering the free model backend side
      const profileData = userTier === 'VIP' ? userProfile : null;
      const result = await askCardExpert(text, profileData)
      setHistory(prev => [...prev, { role: 'ai', content: result.answer, tier: userTier as any }])
    } catch (err) {
      setHistory(prev => [...prev, { role: 'ai', content: "Error connecting to AI engine." }])
    } finally { setLoading(false) }
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
              <h1 className="text-sm sm:text-lg font-black tracking-tight leading-none">SolutionTeamX</h1>
              <span className="text-[8px] sm:text-[9px] text-indigo-600 font-bold uppercase tracking-wider">Engine v2.0</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 relative">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {['en', 'zh', 'cn'].map((id) => (
                <button 
                  key={id} 
                  onClick={() => setLang(id as any)}
                  className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-black rounded-md transition-all ${
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

              {/* TIER LOGIC TOOLTIP (GUEST & BASIC) */}
              {userTier !== 'VIP' && (
                <div className="absolute top-full right-0 mt-3 md:mt-0 md:top-1/2 md:-translate-y-1/2 md:right-auto md:left-full md:ml-4 w-44 md:w-52 bg-indigo-600 text-white text-[11px] sm:text-xs font-bold p-3 rounded-xl shadow-xl animate-bounce z-[200]
                  before:content-[''] before:absolute before:-top-1.5 before:right-6 md:before:top-1/2 md:before:-translate-y-1/2 md:before:-left-1.5 md:before:right-auto before:w-3 before:h-3 before:bg-indigo-600 before:rotate-45">
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
             <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-[10px] font-black mb-6 border border-indigo-100 uppercase tracking-widest">
               <Sparkles className="w-3.5 h-3.5"/> 
               {userTier === 'VIP' ? "VIP Paid AI Enabled" : "Free AI Enabled"}
             </div>
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
            <div key={i} className={`flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[92%] sm:max-w-[85%] p-4 sm:p-5 rounded-2xl border ${
                chat.role === 'user' ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-800 border-slate-100 shadow-sm'
              }`}>
                <div className="text-sm sm:text-base prose prose-sm sm:prose-base max-w-none prose-slate">
                  <ReactMarkdown>{chat.content}</ReactMarkdown>
                </div>
              </div>
              {chat.tier && <span className={`text-[10px] font-black mt-1 uppercase tracking-tighter px-2 ${chat.tier === 'VIP' ? 'text-indigo-500' : 'text-slate-400'}`}>Tier: {chat.tier}</span>}
            </div>
          ))}
          {loading && (
            <div className="text-xs sm:text-sm text-slate-400 font-bold animate-pulse flex items-center gap-2 px-2">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5"/> {t.thinking}
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

              <div className="space-y-2 pb-4">
                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                  <Landmark className="w-3 h-3"/> {t.relationship} *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['HSBC Payroll', 'HSBC Mortgage', 'HSBC MPF', 'Existing Cardholder'].map(rel => (
                    <button 
                      key={rel} type="button" 
                      onClick={() => {
                        const current = userProfile.ownedCards ?? [];
                        const next = current.includes(rel) ? current.filter(c => c !== rel) : [...current, rel];
                        setUserProfile({...userProfile, ownedCards: next});
                      }} 
                      className={`text-[10px] p-3 rounded-xl border font-black transition-all flex items-center justify-center gap-1.5 ${
                        (userProfile.ownedCards ?? []).includes(rel) 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500'
                      }`}
                    >
                      {(userProfile.ownedCards ?? []).includes(rel) && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {t.relationsList[rel]}
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