import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Lấy quyền của user
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
        <div className="font-bold text-xl text-blue-600">MVP Wallet</div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-500">{user.email}</div>
          <LogoutButton />
        </div>
      </header>
      <div className="flex flex-col md:flex-row">
        <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r md:min-h-[calc(100vh-68px)] p-4">
          <nav className="flex flex-col space-y-2">
            <Link href="/dashboard" className="block px-4 py-2 rounded-md hover:bg-slate-100">
              Tổng quan
            </Link>
            <Link href="/dashboard/deposit" className="block px-4 py-2 rounded-md hover:bg-slate-100">
              Nạp tiền (Deposit)
            </Link>
            
            {userData?.role === 'admin' && (
              <div className="pt-2 mt-2 md:pt-4 md:mt-4 border-t border-slate-100">
                <Link href="/admin" className="block px-4 py-2 rounded-md bg-red-50 text-red-700 hover:bg-red-100 font-medium">
                  🛡️ Quản trị
                </Link>
              </div>
            )}
          </nav>
        </aside>
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
