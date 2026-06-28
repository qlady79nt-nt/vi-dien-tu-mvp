export type AppBranding = {
  name: string
  logo: string
  primaryColor: string
  description: string
}

export const appBrandings: Record<string, AppBranding> = {
  chatbot: {
    name: 'DocAI Chatbot',
    logo: '/brands/chatbot.png', // User needs to provide this image later
    primaryColor: '#3B82F6',
    description: 'Nạp tiền để sử dụng AI Chat và các tính năng nâng cao.',
  },
  crm: {
    name: 'CRM Spa',
    logo: '/brands/crm.png',
    primaryColor: '#10B981',
    description: 'Nạp tiền để sử dụng SMS và các tính năng CRM.',
  },
  logo: {
    name: 'Logo AI',
    logo: '/brands/logo.png',
    primaryColor: '#8B5CF6',
    description: 'Nạp tiền để tạo logo và hình ảnh AI.',
  },
  wallet: {
    name: 'DichVuPro Wallet',
    logo: '/favicon.ico', // Default fallback logo
    primaryColor: '#2563EB', // blue-600
    description: 'Nạp tiền vào tài khoản Ví Điện Tử của bạn.',
  }
}

export function getAppBranding(appCode: string | null): AppBranding {
  if (!appCode || !appBrandings[appCode]) {
    return appBrandings['wallet']
  }
  return appBrandings[appCode]
}
