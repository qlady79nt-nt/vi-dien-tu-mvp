import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import { ShieldAlert, ArrowLeft, Activity } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Kiểm tra quyền Admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    redirect('/dashboard') // Nếu không phải admin thì đá về trang user
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 selection:bg-blue-500/30 font-sans">
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center transition-all duration-300 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-rose-500 to-orange-500 p-2 rounded-xl shadow-[0_4px_15px_rgba(244,63,94,0.3)]">
            <ShieldAlert size={20} className="text-white" />
          </div>
          <div>
            <div className="font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-600 text-xl">
              SUPER ADMIN
            </div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1">
              <Activity size={10} className="text-emerald-500" /> Hệ thống đang hoạt động
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-sm shadow-inner">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-slate-700 font-semibold">{user.email}</span>
          </div>
          
          <Link 
            href="/dashboard" 
            className="group flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors py-2"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Về trang User
          </Link>
          
          <div className="h-6 w-px bg-slate-300"></div>
          
          <LogoutButton />
        </div>
      </header>
      
      <main className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        {children}
      </main>
    </div>
  )
}
