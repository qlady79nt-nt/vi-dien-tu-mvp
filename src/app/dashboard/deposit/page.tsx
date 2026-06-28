'use client'

import { useState } from 'react'

export default function DepositPage() {
  const [amount, setAmount] = useState<number>(10000)
  const [loading, setLoading] = useState(false)
  const [qrData, setQrData] = useState<{ code: string, amount: number, qrUrl: string } | null>(null)

  const handleCreateDeposit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/deposit/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      })
      const data = await res.json()
      if (data.success) {
        setQrData(data)
      } else {
        alert(data.error)
      }
    } catch (e) {
      alert('Có lỗi xảy ra')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl bg-white p-8 rounded-xl shadow-sm border">
      <h1 className="text-2xl font-bold mb-6">Nạp tiền vào ví</h1>
      
      {!qrData ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Chọn số tiền nạp</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {[10000, 20000, 50000, 100000, 200000, 500000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt)}
                  className={`py-3 rounded-lg border font-medium ${amount === amt ? 'bg-blue-50 border-blue-600 text-blue-700' : 'hover:bg-slate-50 text-slate-700'}`}
                >
                  {new Intl.NumberFormat('vi-VN').format(amt)}đ
                </button>
              ))}
            </div>
          </div>
          
          <button 
            onClick={handleCreateDeposit}
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700 mt-6"
          >
            {loading ? 'Đang tạo QR...' : 'Tạo mã QR nạp tiền'}
          </button>
        </div>
      ) : (
        <div className="text-center space-y-6">
          <div className="bg-slate-50 p-6 rounded-xl inline-block border">
            <img src={qrData.qrUrl} alt="VietQR" className="w-64 h-64 mx-auto mb-4 rounded-lg" />
            <div className="text-sm text-slate-500 mb-1">Mã nạp tiền (Nội dung chuyển khoản)</div>
            <div className="text-2xl font-mono font-bold text-blue-600">{qrData.code}</div>
            <div className="mt-4 text-sm text-slate-500 mb-1">Số tiền</div>
            <div className="text-xl font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(qrData.amount)}</div>
          </div>
          
          <p className="text-sm text-slate-600 bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-left">
            <strong>Lưu ý quan trọng:</strong> Bạn phải chuyển chính xác số tiền và nội dung chuyển khoản là <strong>{qrData.code}</strong>. Hệ thống sẽ tự động cộng tiền trong vòng 1-3 phút.
          </p>

          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            Quay lại trang chủ
          </button>
        </div>
      )}
    </div>
  )
}
