// hooks/useChatSession.ts
import { useState, useEffect, useTransition } from 'react'
import { supabase, signOut } from '@/lib/auth'
import { askCardExpert } from '@/lib/actions'
import { type Language } from '@/lib/translations'

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  tier?: 'VIP' | 'BASIC' | 'GUEST';
  showDetailButton?: boolean;
  suggestions?: string[];
  applicationUrl?: string;
  bankName?: string;
  cardName?: string;
}

export interface UserProfile {
  fullName: string;
  income: string;
  residencyStatus: string; 
  primarySpend: string; 
  occupation: string;
  employment_type: string; 
  ownedCards: string[]; 
  primaryBank: string;
  bankProducts: string[];
  language: 'en' | 'zh' | 'cn';
}

export function useChatSession() {
  const [lang, setLang] = useState<Language>('en')
  const [question, setQuestion] = useState('')
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isPending, startTransition] = useTransition()
  const [activeView, setActiveView] = useState<'INTRO' | 'CHAT'>('INTRO')
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    fullName: '', income: '', residencyStatus: '', 
    primarySpend: '', occupation: '', employment_type: 'Full-time', 
    ownedCards: [], primaryBank: '', bankProducts: [], language: 'en'
  })

  // Reusable array of canonical database keys to enforce mapping consistency
  const dbKeysMap = ['welcome_offer', 'asia_miles', 'online_spend', 'overseas_spend', 'dining', 'iphone_purchase'];

  const isProfileComplete = Boolean(
    userProfile.income && 
    userProfile.occupation && 
    userProfile.residencyStatus && 
    userProfile.primaryBank &&
    (userProfile.primarySpend && userProfile.primarySpend.length > 0) &&
    (userProfile.primaryBank.includes('None') || userProfile.primaryBank.includes('沒有') || (userProfile.bankProducts && userProfile.bankProducts.length > 0))
  );

  const userTier = !user ? 'GUEST' : isProfileComplete ? 'VIP' : 'BASIC';

  // 📊 Helper 1: Reusable client-side session generator
  const getSessionId = (): string => {
    if (typeof window === 'undefined') return 'server_render';
    let sessionId = localStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  };

  // 📊 Helper 2: Central tracking function directly utilizing your existing lib/auth client injection
  const trackEvent = async (eventType: 'page_view' | 'click_apply' | 'ai_card_query', cardId?: string | null) => {
    try {
      await supabase.from('analytics_events').insert({
        event_type: eventType,
        card_id: cardId || null,
        session_id: getSessionId()
      });
    } catch (error) {
      console.error('📊 Analytics logging skipped:', error);
    }
  };

  // Trigger page_view automatically whenever this hook initializes on the client interface
  useEffect(() => {
    trackEvent('page_view');
  }, []);

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
            primaryBank: profile.primary_bank || '',
            bankProducts: profile.bank_products || [],
            language: (profile.preferred_language as any) || 'en',
            primarySpend: profile.primary_spend || ''
          })
          setLang((profile.preferred_language as any) || 'en')
        }
      }
    }
    checkUser()
  }, [])

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
        primary_bank: userProfile.primaryBank, 
        bank_products: userProfile.bankProducts,
        preferred_language: lang,
        updated_at: new Date().toISOString(),
      });
      if (error) alert(error.message);
      else setIsProfileOpen(false);
    } catch (err) { console.error(err); } 
    finally { setIsSaving(false); }
  };

  const loadCachedTip = async (questionText: string, index: number) => {
    if (!questionText.trim() || loading) return;
    setActiveView('CHAT');
    setHistory(prev => [...prev, { role: 'user', content: questionText }]);
    setLoading(true);
    setQuestion('');

    try {
      const targetDbKey = dbKeysMap[index] ? dbKeysMap[index] : questionText.trim();
      
      // 📊 Track that the user sent an intentional intent query via suggested card templates
      trackEvent('ai_card_query', targetDbKey);

      const { data: cacheData, error: cacheError } = await supabase
        .from('card_tips_cache')
        .select('*')
        .eq('tip_key', targetDbKey)
        .maybeSingle();

      if (cacheError) throw cacheError;

      if (cacheData) {
        let staticAnswer = lang === 'zh' ? cacheData.answer_zh : lang === 'cn' ? cacheData.answer_cn : cacheData.answer_en;
        let rawSuggestions = lang === 'zh' ? cacheData.suggestions_zh : lang === 'cn' ? cacheData.suggestions_cn : cacheData.suggestions_en;
        const cleanSuggestions = Array.isArray(rawSuggestions) ? rawSuggestions : [];

        setHistory(prev => [...prev, {
          role: 'ai',
          content: staticAnswer || "System content localization variant missing.",
          tier: userTier,
          showDetailButton: true,
          suggestions: cleanSuggestions,
          cardName: cacheData.top_card_name_fallback
        }]);
      } else {
        const isVipUser = userTier === 'VIP'; 
        const result = await askCardExpert(questionText, isVipUser, lang);
        if (!result || !result.success) throw new Error(result?.error || "Empty response from AI engine");

        let cleanAnswer = result.answer.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        setHistory(prev => [...prev, { 
          role: 'ai', content: cleanAnswer || "Error...", tier: userTier, showDetailButton: true,
          suggestions: result.suggestions || [], bankName: result.bankName, cardName: result.cardName, applicationUrl: result.applicationUrl
        }]);
      }
    } catch (err) {
      setHistory(prev => [...prev, { role: 'ai', content: "Unable to load data response." }]);
    } finally { setLoading(false); }
  };

  const sendMessage = async (text: string, displayText?: string) => {
    if (!text.trim() || loading) return;
    setActiveView('CHAT');
    
    const trimmedText = text.trim();
    
    const resolvedDbKey = dbKeysMap.includes(trimmedText) 
      ? trimmedText 
      : trimmedText;

    const uiContent = displayText || resolvedDbKey;
    setHistory(prev => [...prev, { role: 'user', content: uiContent }]);
    
    setLoading(true);
    setQuestion('');
    
    try {
      // 📊 Track the text string the user entered manually into the text input frame
      trackEvent('ai_card_query', resolvedDbKey.slice(0, 50));

      let cachedAnswer: string | null = null;
      let cachedSuggestions: string[] = [];
      let cachedCardName: string | undefined;

      const { data: cacheData, error: cacheError } = await supabase
        .from('card_tips_cache')
        .select('*')
        .eq('tip_key', resolvedDbKey)
        .maybeSingle();

      if (!cacheError && cacheData) {
        cachedAnswer = lang === 'zh' ? cacheData.answer_zh : lang === 'cn' ? cacheData.answer_cn : cacheData.answer_en;
        let sug = lang === 'zh' ? cacheData.suggestions_zh : lang === 'cn' ? cacheData.suggestions_cn : cacheData.suggestions_en;
        cachedSuggestions = Array.isArray(sug) ? sug : [];
        cachedCardName = cacheData.top_card_name_fallback;
      }

      if (cachedAnswer) {
        setHistory(prev => [...prev, { 
          role: 'ai', 
          content: cachedAnswer!, 
          tier: userTier, 
          showDetailButton: true, 
          suggestions: cachedSuggestions, 
          cardName: cachedCardName 
        }]);
      } else {
        const isVipUser = userTier === 'VIP'; 
        const result = await askCardExpert(resolvedDbKey, isVipUser, lang);
        if (!result || !result.success) throw new Error(result?.error || "Empty response from AI engine");

        let cleanAnswer = result.answer.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        setHistory(prev => [...prev, { 
          role: 'ai', content: cleanAnswer, tier: userTier, showDetailButton: true,
          suggestions: result.suggestions || [], bankName: result.bankName, cardName: result.cardName, applicationUrl: result.applicationUrl
        }]);
      }
    } catch (err) {
      setHistory(prev => [...prev, { role: 'ai', content: "System connection error." }]);
    } finally { setLoading(false); }
  };

  return {
    lang, setLang, question, setQuestion, history, setHistory, loading, isSaving, isProfileOpen, setIsProfileOpen,
    user, userTier, activeView, setActiveView, userProfile, setUserProfile, isPending, startTransition, isProfileComplete,
    handleLogout, saveProfile, sendMessage, loadCachedTip, trackEvent // 👈 Expose trackEvent so you can call it on the Apply buttons
  };
}