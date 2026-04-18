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
  UserCircle, User, Loader2, Clock
} from 'lucide-react'

// --- TRANSLATIONS ---
const translations: any = {
  en: {
    title: "Max Your Rebates.",
    subtitle: "Unlock the ultimate credit card strategy with our AI-powered engine. Compare, optimize, and earn more on every dollar.",
    login: "Sign In",
    logout: "Sign Out",
    profile: "User Profile",
    nudge: "Get Smarter AI. Log in & complete profile!",
    placeholder: "Ask about HSBC cards or eligibility...",
    thinking: "AI Engine Analyzing...",
    save: "SAVE & UNLOCK AI ANALYSIS",
    saving: "SAVING PROFILE...",
    sector: "Occupation / Job Category",
    employment: "Employment Type",
    residency: "Residency Status",
    goals: "Spending Goals (Select All)",
    relationship: "Banking Relationship",
    disclaimer: "AI-generated advice may be inaccurate. Always verify with the bank's latest Key Fact Statement (KFS).",
    profileRemark: "Complete profile for high-speed AI & personalized analysis.",
    quickTips: ["Best card for iPhone?", "Fastest Asia Miles?", "Top card for China?", "Welcome Offers?"],
    fullNameLabel: "Full Name",
    fullNamePlaceholder: "e.g. Tommy Leung",
    incomeLabel: "Annual Income (HKD)",
    selectRange: "Select Range",
    incomes: {
      range1: "Below $200,000",
      range2: "$200,000 - $400,000",
      range3: "$400,000 - $600,000",
      range4: "Above $600,000"
    },
    employments: {
      fullTime: "Full-time",
      partTime: "Part-time",
      contract: "Contract",
      selfEmployed: "Self-employed",
      unemployed: "Unemployed"
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
    nudge: "登入並填寫資料，解鎖最強 AI！",
    placeholder: "詢問關於滙豐信用卡或申請資格...",
    thinking: "AI 引擎正在分析...",
    save: "儲存並開啟 AI 分析",
    saving: "正在儲存...",
    sector: "職業 / 工作類別",
    employment: "就業類型",
    residency: "居留身份",
    goals: "消費目標 (可多選)",
    relationship: "銀行往來關係",
    disclaimer: "AI 提供的建議僅供參考，或有偏差。請務必參閱銀行最新的服務條款及細則。",
    profileRemark: "填寫資料以解鎖高性能 AI 及個人化分析。",
    quickTips: ["買 iPhone 用邊張卡？", "最快儲里數方法？", "內地消費最強卡？", "最新迎新優惠？"],
    fullNameLabel: "姓名",
    fullNamePlaceholder: "例如：Tommy Leung",
    incomeLabel: "年收入 (HKD)",
    selectRange: "請選擇範圍",
    incomes: {
      range1: "$200,000 以下",
      range2: "$200,000 - $400,000",
      range3: "$400,000 - $600,000",
      range4: "$600,000 以上"
    },
    employments: {
      fullTime: "全職",
      partTime: "兼職",
      contract: "合約員工",
      selfEmployed: "自僱人士",
      unemployed: "待業"
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
    title: "赚尽回赠。",
    subtitle: "透过 AI 引擎制定最强信用卡策略。比较、优化、并在每一份消费赚取最高奖赏。",
    login: "登录",
    logout: "登出",
    profile: "个人档案",
    nudge: "登录并填写资料，解锁最强 AI！",
    placeholder: "询问关于汇丰信用卡或申请资格...",
    thinking: "AI 引擎正在分析...",
    save: "保存并开启 AI 分析",
    saving: "正在储存...",
    sector: "职业 / 工作类别",
    employment: "就业类型",
    residency: "居留身份",
    goals: "消费目标 (可多选)",
    relationship: "银行往来关系",
    disclaimer: "AI 提供的建议仅供参考，或有偏差。请务必参阅银行最新的服务条款及细则。",
    profileRemark: "填写资料以解锁高性能 AI 及个人化分析。",
    quickTips: ["买 iPhone 用哪张卡？", "最快攒里数方法？", "内地消费最强卡？", "最新迎新优惠？"],
    fullNameLabel: "姓名",
    fullNamePlaceholder: "例如：Tommy Leung",
    incomeLabel: "年收入 (HKD)",
    selectRange: "请选择范围",
    incomes: {
      range1: "$200,000 以下",
      range2: "$200,000 - $400,000",
      range3: "$400,000 - $600,000",
      range4: "$600,000 以上"
    },
    employments: {
      fullTime: "全职",
      partTime: "兼职",
      contract: "合约员工",
      selfEmployed: "自雇人士",
      unemployed: "待业"
    },
    residencies: {
      permanent: "香港永久性居民",
      nonResidentCN: "非本地居民 (内地)",
      talent: "人才签证 (IANG/高才通)",
      student: "非本地学生"
    },
    goalsList: {
      Dining: "餐饮",
      Travel: "旅游",
      Online: "网购",
      Insurance: "保险",
      Supermarket: "超市"
    },
    relationsList: {
      'HSBC Payroll': "汇丰代发工资账户",
      'HSBC Mortgage': "汇丰按揭",
      'HSBC MPF': "汇丰强积金",
      'Existing Cardholder': "现有信用卡客户"
    },
    sectors: {
      Gov: "政府人员 / 公务员",
      Edu: "教育人员 / 教师",
      Fin: "银行及金融业",
      Med: "医疗 / 专业人士",
      NGO: "非营利机构 / 社工",
      Self: "自雇 / 营商",
      Others: "其他 / 私营机构"
    }
  }
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  tier?: 'PRO' | 'LOGGED_IN_NO_PROFILE' | 'GUEST'; 
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
    fullName: '',
    income: '', 
    residencyStatus: '', 
    primarySpend: '', 
    occupation: '', 
    employment_type: 'Full-time', 
    ownedCards: [], 
    language: 'en'
  })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
            primarySpend: profile.primary_spend || '',
            occupation: profile.occupation || '',
            employment_type: profile.employment_type || 'Full-time',
            ownedCards: profile.owned_cards || [],
            language: (profile.preferred_language as any) || 'en'
          })
          setLang((profile.preferred_language as any) || 'en')
        }
      }
    }
    checkUser()
  }, [])

  const handleUserHubClick = () => {
    if (!user) {
      signInWithGoogle()
    } else {
      setIsProfileOpen(true)
    }
  }

  const handleLogout = async () => {
    await signOut()
    setIsProfileOpen(false)
    setUser(null)
    window.location.reload()
  }

  const saveProfile = async () => {
    if (!user) return;
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

      if (error) {
        alert(`Error: ${error.message}`);
      } else {
        setIsProfileOpen(false);
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    setHistory(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)
    setQuestion('')
    try {
      const profileToPass = user ? userProfile : null
      const result = await askCardExpert(text, profileToPass)
      setHistory(prev => [...prev, { role: 'ai', content: result.answer, tier: result.tier as any }])
    } catch (err) {
      setHistory(prev => [...prev, { role: 'ai', content: "Error connecting to AI." }])
    } finally { setLoading(false) }
  }

  return (
    <div className="h-screen bg-slate-50 text-slate-900 flex flex-col overflow-hidden relative font-sans">
      
      {/* HEADER */}
      <header className="bg-white border-b px-6 py-3 shrink-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-sm"><CreditCard className="text-white w-5 h-5" /></div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-black tracking-tight leading-none">SolutionTeamX</h1>
              <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-wider">Smart Engine</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {[
                { id: 'en', label: 'ENG' },
                { id: 'zh', label: '繁' },
                { id: 'cn', label: '简' }
              ].map((langObj) => (
                <button key={langObj.id} onClick={() => setLang(langObj.id as any)}
                  className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${lang === langObj.id ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {langObj.label}
                </button>
              ))}
            </div>

            <div className="relative flex items-center">
              <button onClick={handleUserHubClick} className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 border ${user ? 'bg-white border-indigo-100 text-indigo-600' : 'bg-indigo-600 border-indigo-600 text-white'}`}>
                {user ? (
                  <>
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                       {user.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} alt="avatar" /> : <User className="w-3.5 h-3.5" />}
                    </div>
                    <span className="hidden sm:inline">{userProfile.fullName || t.profile}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{t.login}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CHAT AREA */}
      <main className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {history.length === 0 && !loading && (
          <div className="h-full flex flex-col justify-center items-center text-center animate-in fade-in zoom-in duration-500">
             <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-[10px] font-black mb-6 border border-indigo-100 uppercase tracking-widest">
               <Sparkles className="w-3.5 h-3.5"/> Next-Gen AI Power
             </div>
             <h2 className="text-5xl sm:text-6xl font-black mb-4 tracking-tighter text-slate-900 leading-[0.9]">{t.title}</h2>
             <p className="text-slate-500 text-base mb-10 max-w-lg font-medium leading-relaxed">{t.subtitle}</p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {t.quickTips.map((q: string) => (
                  <button key={q} onClick={() => sendMessage(q)} className="bg-white border-2 border-slate-100 p-5 rounded-2xl text-sm font-bold text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/30 hover:shadow-lg transition-all text-left flex justify-between items-center group">
                    {q} <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 translate-x-0 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
             </div>
          </div>
        )}

        <div className="space-y-6">
          {history.map((chat, i) => (
            <div key={i} className={`flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl border ${chat.role === 'user' ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-800 border-slate-100 shadow-sm'}`}>
                <div className="text-sm prose prose-sm max-w-none prose-slate">
                  <ReactMarkdown>{chat.content}</ReactMarkdown>
                </div>
              </div>
              {chat.tier && <span className="text-[8px] font-black mt-1 text-slate-300 uppercase tracking-tighter px-2">Model: {chat.tier}</span>}
            </div>
          ))}
          {loading && <div className="text-xs text-slate-400 font-bold animate-pulse flex items-center gap-2 px-2"><Bot className="w-4 h-4"/> {t.thinking}</div>}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t p-4 shrink-0 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="relative mb-3">
            <input type="text" placeholder={t.placeholder} className="w-full bg-slate-100 rounded-2xl px-5 py-4 pr-14 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage(question)}/>
            <button onClick={() => sendMessage(question)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-2.5 rounded-xl shadow-md active:scale-95 transition-transform"><Send className="w-4 h-4" /></button>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-[10px] text-slate-500 font-medium">
            <span className="flex items-center gap-1 text-slate-600">
              <AlertCircle className="w-3 h-3 text-amber-600"/> {t.disclaimer}
            </span>
          </div>
        </div>
      </footer>

      {/* PROFILE SIDEBAR */}
      {isProfileOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]" onClick={() => setIsProfileOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl z-[70] p-6 flex flex-col animate-in slide-in-from-right">
            <div className="flex justify-between items-center mb-6 border-b pb-4 shrink-0">
              <h3 className="text-lg font-black uppercase tracking-tight">{t.profile}</h3>
              <div className="flex gap-2">
                 <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title={t.logout}><LogOut className="w-5 h-5"/></button>
                 <button onClick={() => setIsProfileOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
            </div>
            
            <div className="space-y-6 flex-1 overflow-y-auto pr-2 pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex gap-3 items-center shrink-0 select-none">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
                <p className="text-[11px] text-indigo-900 font-bold leading-tight m-0 p-0 block">
                  {t.profileRemark}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><UserCircle className="w-3 h-3"/> {t.fullNameLabel}</label>
                <input type="text" placeholder={t.fullNamePlaceholder} value={userProfile.fullName} onChange={(e) => setUserProfile({...userProfile, fullName: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"/>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Landmark className="w-3 h-3"/> {t.incomeLabel}</label>
                <select value={userProfile.income} onChange={(e) => setUserProfile({...userProfile, income: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold outline-none cursor-pointer">
                  <option value="">{t.selectRange}</option>
                  <option value="Below $200k">{t.incomes.range1}</option>
                  <option value="$200k-$400k">{t.incomes.range2}</option>
                  <option value="$400k-$600k">{t.incomes.range3}</option>
                  <option value="Above $600k">{t.incomes.range4}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Briefcase className="w-3 h-3"/> {t.sector}</label>
                <select value={userProfile.occupation} onChange={(e) => setUserProfile({...userProfile, occupation: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold outline-none">
                  <option value="">{t.sector}</option>
                  {Object.entries(t.sectors).map(([key, val]) => (<option key={key} value={key}>{val as string}</option>))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3"/> {t.employment}</label>
                <select value={userProfile.employment_type} onChange={(e) => setUserProfile({...userProfile, employment_type: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold outline-none">
                  <option value="Full-time">{t.employments.fullTime}</option>
                  <option value="Part-time">{t.employments.partTime}</option>
                  <option value="Contract">{t.employments.contract}</option>
                  <option value="Self-employed">{t.employments.selfEmployed}</option>
                  <option value="Unemployed">{t.employments.unemployed}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><MapPin className="w-3 h-3"/> {t.residency}</label>
                <select value={userProfile.residencyStatus} onChange={(e) => setUserProfile({...userProfile, residencyStatus: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold outline-none">
                  <option value="">{t.residency}</option>
                  <option value="Permanent">{t.residencies.permanent}</option>
                  <option value="Non-Resident-CN">{t.residencies.nonResidentCN}</option>
                  <option value="Talent">{t.residencies.talent}</option>
                  <option value="Student">{t.residencies.student}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><ShoppingBag className="w-3 h-3"/> {t.goals}</label>
                <div className="flex flex-wrap gap-2">
                  {['Dining', 'Travel', 'Online', 'Insurance', 'Supermarket'].map(goal => (
                    <button key={goal} type="button" onClick={() => {
                        const current = (userProfile.primarySpend || '').split(',').filter(Boolean);
                        const next = current.includes(goal) ? current.filter(g => g !== goal) : [...current, goal];
                        setUserProfile({...userProfile, primarySpend: next.join(',')});
                      }}
                      className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${(userProfile.primarySpend || '').includes(goal) ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200'}`}
                    >
                      {(userProfile.primarySpend || '').includes(goal) && <CheckCircle2 className="w-3 h-3" />}
                      {t.goalsList[goal]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pb-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Landmark className="w-3 h-3"/> {t.relationship}</label>
                <div className="grid grid-cols-2 gap-2">
                  {['HSBC Payroll', 'HSBC Mortgage', 'HSBC MPF', 'Existing Cardholder'].map(rel => (
                    <button key={rel} type="button" onClick={() => {
                        const next = userProfile.ownedCards.includes(rel) ? userProfile.ownedCards.filter(c => c !== rel) : [...userProfile.ownedCards, rel];
                        setUserProfile({...userProfile, ownedCards: next});
                      }} 
                      className={`text-[9px] p-2.5 rounded-xl border font-black transition-all flex items-center justify-center gap-1.5 ${userProfile.ownedCards.includes(rel) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200'}`}
                    >
                      {userProfile.ownedCards.includes(rel) && <CheckCircle2 className="w-3 h-3" />}
                      {t.relationsList[rel]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <button onClick={saveProfile} disabled={isSaving} className="w-full mt-4 shrink-0 bg-indigo-600 text-white py-4 rounded-2xl font-black text-[11px] shadow-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-[0.98] uppercase tracking-tighter">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} 
              {isSaving ? t.saving : t.save}
            </button>
          </div>
        </>
      )}
    </div>
  )
}