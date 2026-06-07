'use client'

import React from 'react'
import { X, LogOut, Loader2, Zap, UserCircle, Landmark, Briefcase, MapPin, ShoppingBag, CheckCircle2 } from 'lucide-react'
import { type UserProfile } from '../hooks/useChatSession'

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  isSaving: boolean;
  isProfileComplete: boolean;
  onSave: () => void;
  onLogout: () => void;
  t: any;
  lang: string;
}

export function ProfileSidebar({
  isOpen,
  onClose,
  userProfile,
  setUserProfile,
  isSaving,
  isProfileComplete,
  onSave,
  onLogout,
  t,
  lang
}: ProfileSidebarProps) {
  
  if (!isOpen) return null;

  const incomeTiers = ['< $20,000', '$20,000 - $40,000', '$40,000 - $80,000', '> $80,000'];
  const bankingOptions = lang === 'en' 
    ? ['HSBC', 'Hang Seng Bank', 'Standard Chartered', 'Citi', 'BOC (HK)', 'None / Other']
    : ['滙豐銀行', '恒生銀行', '渣打銀行', '花旗銀行', '中國銀行（香港）', '沒有 / 其他'];

  const productOptions = lang === 'en'
    ? ['Prestige / Priority Banking', 'Premium / Elite Banking', 'Standard Checking Account', 'Credit Card Only']
    : ['顯赫 / 優先理財等級', '升級 / 唯達理財等級', '一般出糧戶口', '僅持有信用卡'];

  const spendingGoals = ['welcome_offer', 'asia_miles', 'online_spend', 'overseas_spend', 'dining', 'iphone_purchase'];

  const toggleGoal = (goal: string) => {
    setUserProfile(prev => {
      const currentGoals = prev?.primarySpend ? prev.primarySpend.split(',') : [];
      const updatedGoals = currentGoals.includes(goal)
        ? currentGoals.filter(g => g !== goal)
        : [...currentGoals, goal];
      return { ...prev, primarySpend: updatedGoals.join(',') };
    });
  };

  const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextBank = e.target.value;
    setUserProfile(prev => ({
      ...prev,
      primaryBank: nextBank,
      bankProducts: [] 
    }));
  };

  const currentBank = userProfile?.primaryBank ?? '';
  const isNoBankSelected = !currentBank || currentBank.includes('None') || currentBank.includes('沒有');

  return (
    <>
      {/* Backdrop overlay filter */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] animate-in fade-in duration-200" 
        onClick={onClose} 
      />

      {/* Sidebar Panel Container */}
      <div className="fixed inset-y-0 right-0 w-full max-w-xs sm:max-w-sm bg-white shadow-2xl z-[210] p-5 flex flex-col justify-between animate-in slide-in-from-right duration-300">
        <div className="flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden">
          
          {/* Header Action Section */}
          <div className="flex items-center justify-between pb-4 border-b mb-5 sticky top-0 bg-white z-10">
            <div className="flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-indigo-600" />
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">
                {t?.profileTitle || 'User Profile'}
              </h3>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close profile sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Fields Stack */}
          <div className="space-y-5">
            {/* Full Name Input Field */}
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" /> {t?.fieldFullName || 'Full Name'}
              </label>
              <input
                type="text"
                value={userProfile?.fullName ?? ''}
                onChange={(e) => setUserProfile(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder={lang === 'en' ? 'e.g. John Doe' : '例如：張小明'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

            {/* Income Tier Dropdown Field */}
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-slate-400" /> {t?.fieldIncome || 'Monthly Income (HKD)'}
              </label>
              <select
                value={userProfile?.income ?? ''}
                onChange={(e) => setUserProfile(prev => ({ ...prev, income: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none"
              >
                <option value="">{lang === 'en' ? '-- Select Income Tier --' : '-- 選擇收入範圍 --'}</option>
                {incomeTiers.map((tier) => (
                  <option key={tier} value={tier}>{tier}</option>
                ))}
              </select>
            </div>

            {/* Residency Status Option Grid */}
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {t?.fieldResidency || 'Residency Status'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[(lang === 'en' ? 'HK Resident' : '香港居民'), (lang === 'en' ? 'Non-Resident' : '非香港居民')].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setUserProfile(prev => ({ ...prev, residencyStatus: status }))}
                    className={`py-3 text-xs font-black border rounded-xl transition-all ${
                      userProfile?.residencyStatus === status
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Bank Dropdown Field */}
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-slate-400" /> {t?.fieldPrimaryBank || 'Primary Bank'}
              </label>
              <select
                value={currentBank}
                onChange={handleBankChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none"
              >
                <option value="">{lang === 'en' ? '-- Select Bank --' : '-- 選擇主要銀行 --'}</option>
                {bankingOptions.map((bank) => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>

            {/* Held Bank Products Segment */}
            {!isNoBankSelected && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-slate-400" /> {t?.fieldProducts || 'Held Bank Products'}
                </label>
                <div className="space-y-1.5">
                  {productOptions.map((prod) => {
                    const isChecked = (userProfile?.bankProducts || []).includes(prod);
                    return (
                      <button
                        key={prod}
                        type="button"
                        onClick={() => {
                          setUserProfile(prev => {
                            const current = prev?.bankProducts || [];
                            const updated = current.includes(prod) 
                              ? current.filter(p => p !== prod) 
                              : [...current, prod];
                            return { ...prev, bankProducts: updated };
                          });
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-xs font-bold border rounded-xl flex items-center justify-between transition-all ${
                          isChecked ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <span>{prod}</span>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Spending Intention Selection Badges */}
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-slate-400" /> {t?.fieldSpend || 'Primary Spending Intentions'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {spendingGoals.map((goal) => {
                  const isSelected = (userProfile?.primarySpend || '').includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${
                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {t?.goalsList ? t.goalsList[goal] : goal}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Action Commit Drawer Footer */}
        <div className="pt-4 border-t mt-4 space-y-2 bg-white sticky bottom-0">
          <button
            onClick={onSave}
            disabled={!isProfileComplete || isSaving}
            className={`w-full py-4 rounded-2xl font-black text-xs shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] uppercase tracking-tighter ${
              isProfileComplete
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
            {isSaving ? t?.saving : (isProfileComplete ? t?.save : t?.completeRequired)}
          </button>

          <button
            onClick={onLogout}
            className="w-full py-3.5 rounded-2xl font-black text-xs border border-rose-100 hover:bg-rose-50 text-rose-500 transition-colors flex items-center justify-center gap-2 uppercase tracking-tighter"
          >
            <LogOut className="w-4 h-4" />
            {t?.logout || 'Logout Account'}
          </button>
        </div>
      </div>
    </>
  );
}