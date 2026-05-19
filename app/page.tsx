'use client'

import { translations, type Language } from '@/lib/translations'
import { useRef, useEffect } from 'react'
import { useChatSession } from './hooks/useChatSession' 
import { Header } from './components/Header'
import { ChatInterface } from './components/ChatInterface'
import { SearchFooter } from './components/SearchFooter'
import { ProfileSidebar } from './components/ProfileSidebar'
import { ChevronRight, Loader2 } from 'lucide-react'

export default function HomePage() {
  const {
    lang, setLang, question, setQuestion, history, setHistory, loading, isSaving, isProfileOpen, setIsProfileOpen,
    user, userTier, activeView, setActiveView, userProfile, setUserProfile, isPending, startTransition, isProfileComplete,
    handleLogout, saveProfile, sendMessage, loadCachedTip
  } = useChatSession()

  // Ensure t always resolves to a valid translation object based on current selected language state
  const currentLang: Language = (lang as Language) || 'en'
  const t = translations[currentLang] || translations['en']

  // The 6 exact background database slug strings matching your card_tips_cache keys
  const quickTipSlugs = [
    'welcome_offer',
    'asia_miles',
    'online_spend',
    'overseas_spend',
    'dining',
    'iphone_purchase'
  ]

  if (loading && !userProfile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans antialiased text-slate-600">
      <Header 
        lang={lang} 
        setLang={setLang} 
        user={user} 
        setIsProfileOpen={setIsProfileOpen} 
        t={t} 
      />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-4xl w-full mx-auto flex flex-col justify-between">
        {activeView === 'INTRO' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 my-auto animate-in fade-in duration-300">
            <div className="space-y-3">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                {t?.title || 'Bounty Board Credit Card Expert'}
              </h1>
              <p className="max-w-md text-sm text-slate-500 font-medium mx-auto">
                {t?.subtitle || 'Unlock the ultimate credit card strategy with our AI-powered engine.'}
              </p>
            </div>

            {/* Quick Tips Grid Layout mapping exactly 1-to-1 with your translation array indices */}
            <div className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
              {quickTipSlugs.map((slug, index) => {
                
                // 🎯 Hardened Fallback Resolver:
                // First try pulling from the array via index. If the array hasn't loaded yet,
                // fall back immediately to an explicit string dictionary mapping supporting en, zh, and cn.
                let tipLabel = slug;
                
                if (t?.quickTips && Array.isArray(t.quickTips) && t.quickTips[index]) {
                  tipLabel = t.quickTips[index];
                } else {
                  const fallbackMap: Record<string, string> = {
                    welcome_offer: currentLang === 'en' ? "Compare Credit Card Welcome Offers" : currentLang === 'zh' ? "信用卡迎新優惠比較" : "信用卡迎新优惠比较",
                    asia_miles: currentLang === 'en' ? "Compare Air Miles Credit Cards" : currentLang === 'zh' ? "飛行里數信用卡比較" : "飞行里程信用卡比较",
                    online_spend: currentLang === 'en' ? "Best Credit Cards for Online Shopping" : currentLang === 'zh' ? "網上購物信用卡比較" : "网上购物信用卡比较",
                    overseas_spend: currentLang === 'en' ? "Best Credit Cards for Overseas Spending" : currentLang === 'zh' ? "海外簽賬信用卡比較" : "海外签账信用卡比较",
                    dining: currentLang === 'en' ? "Best Credit Cards for Dining" : currentLang === 'zh' ? "食飯信用卡比較" : "吃饭信用卡比较",
                    iphone_purchase: currentLang === 'en' ? "Best Credit Card Promos for Buying iPhone" : currentLang === 'zh' ? "買iPhone信用卡優惠比較" : "买iPhone信用卡优惠比较",
                  };
                  tipLabel = fallbackMap[slug] || slug;
                }
                
                return (
                  <button
                    key={slug}
                    onClick={() => {
                      setActiveView('CHAT');
                      // ✨ Fixed: Passes both the database key slug AND the human FAQ display text to the newly updated hook handler
                      sendMessage(slug, tipLabel); 
                    }}
                    className="flex items-center justify-between p-3.5 bg-white border border-slate-200/80 rounded-2xl text-left text-xs font-black text-slate-700 hover:border-indigo-500 hover:text-indigo-600 shadow-sm hover:shadow-md transition-all group active:scale-[0.98]"
                  >
                    {/* line-clamp-2 allows full descriptive questions to display cleanly without truncation breaks */}
                    <span className="line-clamp-2 pr-1 leading-relaxed">{tipLabel}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <ChatInterface 
            history={history}
            lang={lang}
            user={user}
            loading={loading}
            onReset={() => setActiveView('INTRO')}
            onSendMessage={sendMessage}
            setHistory={setHistory}
            t={t}
          />
        )}
      </main>

      <SearchFooter 
        question={question}
        setQuestion={setQuestion}
        activeView={activeView}
        lang={lang}
        onSendMessage={(text: string) => {
          setActiveView('CHAT')
          sendMessage(text)
        }}
        t={t}
      />

      <ProfileSidebar 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
        isSaving={isSaving}
        isProfileComplete={isProfileComplete}
        onSave={saveProfile}
        onLogout={handleLogout}
        t={t}
        lang={lang}
      />
    </div>
  )
}