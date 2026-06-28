'use client'

import { useState } from 'react'
import { AppBranding } from '@/config/appBranding'
import { DepositBrandCard } from '@/components/DepositBrandCard'

export default function DepositClient({ branding, appCode }: { branding: AppBranding, appCode: string }) {
  const [amount, setAmount] = useState<number>(50000)
  const [loading, setLoading] = useState(false)
  const [qrData, setQrData] = useState<{ code: string, amount: number, qrUrl: string } | null>(null)

  const handleCreateDeposit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/deposit/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount,
          sourceApp: appCode,
          // Mặc định frontend lấy từ user session nên không truyền UserID nguồn (trừ phi hệ thống nguồn chèn vào param url)
        })
      })
      const data = await res.json()
      if (data.success) {
        setQrData(data)
      } else {
        alert(data.error)
      }
    } catch (e) {
      alert('Có lỗi xảy ra khi tạo yêu cầu nạp tiền')
    }
    setLoading(false)
  }

  if (qrData) {
    return (
      <DepositBrandCard 
        branding={branding} 
        amount={qrData.amount} 
        qrUrl={qrData.qrUrl} 
        transferContent={qrData.code} 
        status="Đang chờ thanh toán" 
      />
    )
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
      <div className="text-center mb-8">
        <img 
          src={branding.logo} 
          alt={branding.name} 
          className="w-16 h-16 mx-auto rounded-full mb-4 object-contain shadow-sm"
          onError={(e) => { (e.target as HTMLImageElement).src = '/favicon.ico' }}
        />
        <h1 className="text-2xl font-bold text-slate-800">{branding.name}</h1>
        <p className="text-slate-500 mt-2 text-sm">{branding.description}</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">Chọn số tiền nạp</label>
          <div className="grid grid-cols-2 gap-3">
            {[20000, 50000, 100000, 200000].map(amt => (
              <button
                key={amt}
                onClick={() => setAmount(amt)}
                className={`py-3 rounded-xl border-2 font-bold transition-colors ${
                  amount === amt 
                    ? 'text-white border-transparent' 
                    : 'hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
                style={amount === amt ? { backgroundColor: branding.primaryColor } : {}}
              >
                {new Intl.NumberFormat('vi-VN').format(amt)}đ
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleCreateDeposit}
          disabled={loading}
          className="w-full text-white rounded-xl py-4 font-bold transition-opacity hover:opacity-90 disabled:opacity-50 mt-6"
          style={{ backgroundColor: branding.primaryColor }}
        >
          {loading ? 'Đang xử lý...' : 'Tạo mã nạp tiền'}
        </button>
      </div>
    </div>
  )
}
