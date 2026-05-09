import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

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
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="bg-slate-800 shadow-sm border-b border-slate-700 px-6 py-4 flex justify-between items-center">
        <div className="font-bold text-xl text-red-500">SUPER ADMIN</div>
        <div className="text-sm flex gap-4 items-center">
          <span className="text-slate-400">{user.email}</span>
          <Link href="/dashboard" className="text-blue-400 hover:underline pr-4 border-r border-slate-700">Về trang User</Link>
          <LogoutButton />
        </div>
      </header>
      <main className="p-8">
        {children}
      </main>
    </div>
  )
}
