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
      <div className="flex gap-4 pt-2">
        <button 
          onClick={(e) => handleAuth(e, false)}
          disabled={loading}
          className="flex-1 bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700"
        >
          Đăng nhập
        </button>
        <button 
          onClick={(e) => handleAuth(e, true)}
          disabled={loading}
          className="flex-1 bg-slate-100 text-slate-700 rounded-md py-2 font-medium hover:bg-slate-200"
        >
          Đăng ký
        </button>
      </div>
    </form>
  )
}
