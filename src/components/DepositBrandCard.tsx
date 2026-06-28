'use client'

import { AppBranding } from '@/config/appBranding'

interface DepositBrandCardProps {
  branding: AppBranding
  amount: number
  qrUrl: string
  transferContent: string
  status: string
}

export function DepositBrandCard({ branding, amount, qrUrl, transferContent, status }: DepositBrandCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full mx-auto border border-slate-100">
      <div 
        className="p-6 text-white text-center"
        style={{ backgroundColor: branding.primaryColor }}
      >
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
          <img 
            src={branding.logo} 
            alt={branding.name} 
            className="w-10 h-10 object-contain rounded-full"
            onError={(e) => {
              // Fallback icon if image doesn't exist
              (e.target as HTMLImageElement).src = '/favicon.ico'
            }}
          />
        </div>
        <h2 className="text-2xl font-bold">{branding.name}</h2>
        <p className="text-white/80 mt-1 text-sm">{branding.description}</p>
      </div>
      
      <div className="p-8 text-center space-y-6">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 inline-block">
          <img src={qrUrl} alt="QR Code" className="w-56 h-56 mx-auto rounded-lg shadow-sm" />
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="text-sm text-slate-500 mb-1">Số tiền thanh toán</div>
            <div className="text-3xl font-black" style={{ color: branding.primaryColor }}>
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-slate-500 mb-1">Nội dung chuyển khoản (bắt buộc)</div>
            <div className="text-xl font-mono font-bold bg-slate-100 py-3 px-4 rounded-lg inline-block tracking-widest text-slate-800 border border-slate-200">
              {transferContent}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <p className="text-sm text-slate-600">
            Hệ thống sẽ tự động cập nhật số dư sau khi thanh toán thành công (1-3 phút).
          </p>
        </div>
      </div>
    </div>
  )
}
