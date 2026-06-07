// components/Header.tsx
import { type Language } from '@/lib/translations'
import { CreditCard, LogIn, User } from 'lucide-react'
import { supabase } from '@/lib/auth' 

interface HeaderProps {
  lang: Language;
  setLang: (l: Language) => void;
  user: any;
  setIsProfileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  t: any;
}

export function Header({ lang, setLang, user, setIsProfileOpen, t }: HeaderProps) {
  const userTier = user?.user_metadata?.tier ?? 'GUEST'
  const userProfile = user?.user_metadata?.profile

  // Determine if the UI layout should treat them as a truly registered account
  const isFullyLoggedIn = user && user.email && user.email.includes('@');

  const handleAccountAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isFullyLoggedIn) {
      // A genuine, verified logged-in user session exists -> open the panel drawer
      setIsProfileOpen(true)
    } else {
      // Missing a real email string -> Treat as guest and force redirect to Google OAuth
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            // Forces the callback routine to return back to your local workspace machine
            redirectTo: 'http://localhost:3000/auth/callback',
            // Forces Google to clear auto-login caching and present the account selection pane
            queryParams: {
              prompt: 'select_account',
              access_type: 'offline'
            }
          },
        })
        if (error) throw error
      } catch (err) {
        console.error('Error initiating Google OAuth authentication pipeline:', err)
      }
    }
  }

  return (
    <header className="shrink-0 bg-white border-b px-4 sm:px-6 py-3 z-[100] shadow-sm pt-[calc(0.75rem+env(safe-area-inset-top))]">
      <div className="max-w-5xl mx-auto flex items-center justify-between relative">
        {/* Logo Section */}
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-sm">
            <CreditCard className="text-white w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-lg font-black tracking-tight leading-none text-slate-900">SolutionTeamX</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] sm:text-xs text-indigo-600 font-black uppercase tracking-[0.1em]">
                {t?.headerLabel || 'AI REBATE HUNTER'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 relative">
          {/* Language Selector */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {(['en', 'zh', 'cn'] as Language[]).map((id) => (
              <button 
                key={id} 
                onClick={() => setLang(id)}
                className={`px-3 py-1.5 text-xs sm:text-sm font-black rounded-md transition-all ${
                  lang === id 
                    ? 'bg-white shadow-sm text-indigo-600' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {id === 'en' ? 'ENG' : id === 'zh' ? '繁' : '簡'}
              </button>
            ))}
          </div>

          {/* Account Profile Control Action Trigger */}
          <div className="relative flex items-center">
            <button 
              onClick={handleAccountAction} 
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition-all shadow-md border cursor-pointer ${
                isFullyLoggedIn ? 'bg-white border-indigo-100 text-indigo-600' : 'bg-indigo-600 border-indigo-600 text-white'
              }`}
            >
              {isFullyLoggedIn ? (
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
              ) : (
                <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              <span className="hidden xs:inline">
                {isFullyLoggedIn ? (userProfile?.fullName || t?.profile || 'Profile') : (t?.login || 'Login')}
              </span>
            </button>

            {/* Account Nudge Tier Tooltip Banner */}
            {userTier !== 'VIP' && (
              <div className="absolute top-full right-0 mt-3 md:mt-0 md:top-1/2 md:-translate-y-1/2 md:right-auto md:left-full md:ml-4 w-44 md:w-52 bg-indigo-600/80 backdrop-blur-md text-white text-[11px] sm:text-xs font-bold p-3 rounded-xl shadow-xl z-[200] pointer-events-none">
                {userTier === 'GUEST' ? t?.nudgeGuest : t?.nudgeBasic}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}