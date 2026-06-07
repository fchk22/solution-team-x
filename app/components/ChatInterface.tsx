import ReactMarkdown from 'react-markdown'
import { Bot, Zap, ChevronRight, User } from 'lucide-react'
import { type ChatMessage } from '../hooks/useChatSession'

interface ChatInterfaceProps {
  history: ChatMessage[];
  lang: string;
  user: any;
  loading: boolean;
  onReset: () => void;
  onSendMessage: (text: string) => void;
  setHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  t: any;
  // 📊 Added to handle client-side metric conversions
  onTrackEvent?: (eventType: 'page_view' | 'click_apply' | 'ai_card_query', cardId?: string | null) => Promise<void> | void;
}

export function ChatInterface({ 
  history, 
  lang, 
  user, 
  loading, 
  onReset, 
  onSendMessage, 
  setHistory, 
  t,
  onTrackEvent // 👈 Destructured analytics listener tracking layer
}: ChatInterfaceProps) {
  
  // Helper to normalize card names into uniform lowercase snake_case slugs matching database parameters
  const getFormattedCardId = (name?: string): string | null => {
    if (!name) return null;
    return name.toLowerCase().trim().replace(/[^a-z0-9_\s]/g, '').replace(/\s+/g, '_');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Back to Tips button removed from here to ensure direct stream continuity */}

      {history.map((chat, i: number) => (
        <div key={i} className={`flex w-full gap-3 ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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

            <div className={`p-4 sm:p-5 rounded-2xl border ${chat.role === 'user' ? 'bg-slate-900 text-white border-slate-800 rounded-tr-none' : 'bg-white text-slate-800 border-slate-100 shadow-sm rounded-tl-none'}`}>
              <div className="text-sm sm:text-base prose prose-sm max-w-none prose-slate prose-ol:list-decimal prose-ol:pl-4 prose-li:my-3">
                <ReactMarkdown
                  components={{
                    a: ({ href, children }) => {
                      const linkText = String(children || '');
                      const isApplyLink = linkText.includes('Apply now') || linkText.includes('立即申請') || linkText.includes('立即申请');
                      if (isApplyLink) {
                        return (
                          <a 
                            href={href} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onClick={() => {
                              if (onTrackEvent) {
                                // Fall back to message properties if the markdown injection context lacks unique identifiers
                                const idCandidate = chat.cardName || linkText;
                                onTrackEvent('click_apply', getFormattedCardId(idCandidate));
                              }
                            }}
                            className="inline-flex items-center gap-0.5 px-3 py-1 text-[11px] font-black rounded-full text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md transition-all hover:-translate-y-0.5 no-underline mx-1.5 align-middle select-none"
                          >
                            {children}<span className="text-[9px]">↗</span>
                          </a>
                        );
                      }
                      return <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline font-black">{children}</a>;
                    }
                  }}
                >
                  {chat.content}
                </ReactMarkdown>
              </div>
            </div>

            {chat.role === 'ai' && chat.suggestions && chat.suggestions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {chat.suggestions.map((sug: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const newHistory = [...history];
                      newHistory[i].suggestions = []; 
                      setHistory(newHistory);
                      onSendMessage(sug);
                    }}
                    className="px-3 py-1.5 bg-white border rounded-full text-[11px] font-bold text-slate-600 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-1.5 animate-in fade-in"
                  >
                    <Zap className="w-3 h-3 text-indigo-400" />{sug}
                  </button>
                ))}
              </div>
            )}

            {chat.role === 'ai' && chat.applicationUrl && (
              <div className="mt-5">
                <a 
                  href={chat.applicationUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={() => {
                    // 📊 Track the outbound connection click for the overarching CTA component banner
                    if (onTrackEvent) {
                      onTrackEvent('click_apply', getFormattedCardId(chat.cardName));
                    }
                  }}
                  className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 text-white rounded-2xl shadow-lg hover:-translate-y-1 transition-all"
                >
                  <div className="bg-white/20 p-1.5 rounded-lg">
                    <Zap className="w-4 h-4 fill-white" />
                  </div>
                  <span className="text-sm sm:text-base font-black">
                    {lang === 'en' ? `Apply ${chat.cardName || ''} now` : `立即申請${chat.cardName || ''}`}
                  </span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            )}
          </div>

          {chat.role === 'user' && (
            <div className="shrink-0 mt-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="user" className="w-full h-full object-cover" />
                ) : (
                  <User className="text-slate-500 w-5 h-5" />
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {loading && (
        <div className="flex gap-3 items-center px-2 animate-pulse">
          <div className="bg-slate-100 p-1.5 rounded-lg">
            <Bot className="text-slate-400 w-4 h-4" />
          </div>
          <div className="text-xs sm:text-sm text-slate-400 font-bold">{t.thinking}</div>
        </div>
      )}
    </div>
  )
}