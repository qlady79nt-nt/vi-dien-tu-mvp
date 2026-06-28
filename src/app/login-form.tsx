'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
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
      const nextUrl = searchParams.get('next')
      router.push(nextUrl ? nextUrl : '/dashboard')
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
        <div className="relative mt-1">
          <input 
            type={showPassword ? "text" : "password"} 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        </div>
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
