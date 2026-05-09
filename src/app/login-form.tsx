'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent, isSignUp: boolean) => {
    e.preventDefault()
    
    if (!email || !password) {
      alert('Vui lòng nhập đầy đủ Email và Mật khẩu')
      return
    }

    setLoading(true)
    
    let error
    if (isSignUp) {
      const res = await supabase.auth.signUp({ email, password })
      error = res.error
    } else {
      const res = await supabase.auth.signInWithPassword({ email, password })
      error = res.error
    }

    if (error) {
      alert(error.message)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Email</label>
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
        />
      </div>
      <div className="pt-2">
        <button 
          onClick={(e) => handleAuth(e, false)}
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700"
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </div>
      <div className="text-center text-sm mt-4">
        Chưa có tài khoản? <a href="/register" className="text-blue-600 hover:underline">Đăng ký ví mới</a>
      </div>
    </form>
  )
}
