'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      alert('Vui lòng nhập đầy đủ Email và Mật khẩu')
      return
    }

    setLoading(true)
    const { error, data } = await supabase.auth.signUp({ email, password })
    
    if (error) {
      alert(error.message)
    } else {
      alert('Đăng ký thành công! Đang chuyển vào ví...')
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="p-8 bg-white rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-slate-800">Tạo Ví Điện Tử Mới</h1>
        <form className="space-y-4" onSubmit={handleRegister}>
          <div>
            <label className="block text-sm font-medium text-slate-700">Email của bạn</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Mật khẩu</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
              required
              minLength={6}
            />
            <p className="text-xs text-slate-500 mt-1">Mật khẩu phải từ 6 ký tự trở lên</p>
          </div>
          <div className="pt-2">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700"
            >
              {loading ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}
            </button>
          </div>
          <div className="text-center text-sm mt-4">
            Đã có tài khoản? <Link href="/" className="text-blue-600 hover:underline">Đăng nhập ngay</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
