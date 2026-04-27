// lib/translations.ts

export type Language = 'en' | 'zh' | 'cn';

export const translations: Record<Language, any> = {
  en: {
    title: "Max Your Rebates.",
    subtitle: "Unlock the ultimate credit card strategy with our AI-powered engine. Compare, optimize, and earn more on every dollar.",
    login: "Sign In",
    logout: "Sign Out",
    profile: "User Profile",
    headerLabel: "AI REBATE HUNTER",
    aiEnabled: "AI Rebate Hunter",
    nudgeGuest: "Log in & complete profile to unlock high-speed VIP AI!",
    nudgeBasic: "Complete your profile to unlock high-speed VIP AI!",
    placeholder: "Ask about credit cards welcome offer or rebate...",
    thinking: "AI Engine Analyzing...",
    save: "SAVE & UNLOCK PAID AI",
    saving: "SAVING PROFILE...",
    requiredNote: "* All fields except Name are required to unlock VIP Tier.",
    completeRequired: "Complete Required Fields",
    sector: "Occupation / Job Category",
    residency: "Residency Status",
    goals: "Spending Goals (Select All)",
    disclaimer: "AI-generated advice may be inaccurate. Always verify with the bank's latest Key Fact Statement (KFS).",
    profileRemark: "Complete profile for high-speed VIP AI & personalized analysis.",
    quickTips: ["Best card for iPhone?", "Fastest Asia Miles?", "Best card for spending in China?", "Welcome Offers?"],
    fullNameLabel: "Full Name (Optional)",
    fullNamePlaceholder: "e.g. Tommy Leung",
    incomeLabel: "Annual Income (HKD)",
    selectRange: "Select Range",
    primaryBankLabel: "Primary HK Bank",
    primaryBankPlaceholder: "Select your main bank",
    bankProductsLabel: "Products with this bank (Select all)",
    banks: ['HSBC', 'Standard Chartered', 'Hang Seng', 'BOC (HK)', 'Citibank', 'DBS', 'None / Others'],
    productsList: {
      Payroll: "Payroll Account",
      Priority: "Priority / Premier Banking",
      Mortgage: "Mortgage Loan",
      Deposit: "Time Deposit / High Savings",
      CreditCard: "Credit Card"
    },
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
    sectors: {
      Gov: "Government / Civil Servant",
      Edu: "Education / Teacher",
      Fin: "Banking & Finance",
      Med: "Medical / Professional",
      NGO: "NGO / Social Work",
      Self: "Self-Employed / Business Owner",
      Others: "Others / Private Sector"
    },
    wantDetails: "Want to know the details"
  },
  zh: {
    title: "賺盡回贈。",
    subtitle: "透過 AI 引擎制定最強信用卡策略。比較、優化、並在每一蚊消費賺取最高獎賞。",
    login: "登入",
    logout: "登出",
    profile: "個人檔案",
    headerLabel: "AI 回贈獵人",
    aiEnabled: "AI 回贈獵人",
    nudgeGuest: "立即登入並填寫資料，開啟 VIP 高速 AI 模式！",
    nudgeBasic: "填寫資料，開啟 VIP 高速 AI 模式！",
    placeholder: "詢問關於信用卡迎新優惠或回贈...",
    thinking: "AI 引擎正在分析...",
    save: "儲存並開啟 VIP AI",
    saving: "正在儲存...",
    requiredNote: "* 除姓名外，所有欄位均為必填，以解鎖 VIP 權限。",
    completeRequired: "請填寫所有必填欄位",
    sector: "職業 / 工作類別",
    residency: "居留身份",
    goals: "消費目標 (可多選)",
    disclaimer: "AI 提供的建議僅供參考，或有偏差。請務必參閱銀行最新的服務條款及細則。",
    profileRemark: "填寫資料以解鎖高性能 VIP AI 及個人化分析。",
    quickTips: ["買 iPhone 用邊張卡？", "最快儲里數方法？", "返內地消費用邊張卡？", "最新迎新優惠？"],
    fullNameLabel: "姓名 (選填)",
    fullNamePlaceholder: "例如：Tommy Leung",
    incomeLabel: "年收入 (HKD)",
    selectRange: "請選擇範圍",
    primaryBankLabel: "主要往來銀行",
    primaryBankPlaceholder: "請選擇最常用的銀行",
    bankProductsLabel: "您在該銀行的產品/服務 (可多選)",
    banks: ['滙豐 HSBC', '渣打 Standard Chartered', '恒生 Hang Seng', '中銀香港 BOC', '花旗 Citibank', '星展 DBS', '沒有 / 其他'],
    productsList: {
      Payroll: "出糧戶口",
      Priority: "卓越 / 優先理財",
      Mortgage: "按揭貸款",
      Deposit: "定期存款 / 大額活期",
      CreditCard: "信用卡"
    },
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
    sectors: {
      Gov: "政府人員 / 公務員",
      Edu: "教育界 / 教師",
      Fin: "銀行及金融業",
      Med: "醫療 / 專業人士",
      NGO: "非牟利機構 / 社工",
      Self: "自僱 / 營商",
      Others: "其他 / 私營機構"
    },
    wantDetails: "想了解詳情"
  },
  cn: {
    title: "赚尽返现。",
    subtitle: "通过 AI 引擎制定最强信用卡策略。比较、优化、并在每一笔消费中赚取最高奖赏。",
    login: "登录",
    logout: "登出",
    profile: "个人资料",
    headerLabel: "AI 返现猎人",
    aiEnabled: "AI 返现猎人",
    nudgeGuest: "立即登录并填写资料，开启 VIP 高速 AI 模式！",
    nudgeBasic: "填写资料，开启 VIP 高速 AI 模式！",
    placeholder: "询问关于信用卡迎新礼遇或返现...",
    thinking: "AI 引擎正在分析...",
    save: "保存并开启 VIP AI",
    saving: "正在保存...",
    requiredNote: "* 除姓名外，所有字段均为必填，以解锁 VIP 权限。",
    completeRequired: "请填写所有必填字段",
    sector: "职业 / 工作类别",
    residency: "居留身份",
    goals: "消费目标 (可多选)",
    disclaimer: "AI 提供的建议仅供参考，或有偏差。请务必参阅银行最新的服务条款及细则。",
    profileRemark: "填写资料以解锁高性能 VIP AI 及个性化分析。",
    quickTips: ["买 iPhone 用哪张卡？", "最快攒里程方法？", "内地消费最强卡？", "最新迎新优惠？"],
    fullNameLabel: "姓名 (选填)",
    fullNamePlaceholder: "例如：Tommy Leung",
    incomeLabel: "年收入 (HKD)",
    selectRange: "请选择范围",
    primaryBankLabel: "主要往来银行",
    primaryBankPlaceholder: "请选择最常用的银行",
    bankProductsLabel: "您在该银行的产品/服务 (可多选)",
    banks: ['汇丰 HSBC', '渣打 Standard Chartered', '恒生 Hang Seng', '中银香港 BOC', '花旗 Citibank', '星展 DBS', '没有 / 其他'],
    productsList: {
      Payroll: "代发工资账户",
      Priority: "卓越 / 优先理财",
      Mortgage: "按揭贷款",
      Deposit: "定期存款 / 大额活期",
      CreditCard: "信用卡"
    },
    incomes: {
      range1: "$200,000 以下",
      range2: "$200,000 - $400,000",
      range3: "$400,000 - $600,000",
      range4: "$600,000 以上"
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
    sectors: {
      Gov: "政府人员 / 公务员",
      Edu: "教育人员 / 教师",
      Fin: "银行及金融业",
      Med: "医疗 / 专业人士",
      NGO: "非营利机构 / 社工",
      Self: "自雇 / 营商",
      Others: "其他 / 私营机构"
    },
    wantDetails: "想了解详情"
  }
};