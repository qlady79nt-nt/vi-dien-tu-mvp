import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Lấy số dư ví
  const { data: wallet } = await supabase
    .from('wallets')
    .select('cash_balance')
    .eq('user_id', user?.id)
    .single()

  // Lấy số dư credit
  const { data: credits } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', user?.id)

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Tổng quan tài khoản</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border">
          <h2 className="text-slate-500 text-sm font-medium">Số dư VNĐ</h2>
          <div className="text-2xl md:text-3xl font-bold mt-2">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(wallet?.cash_balance || 0)}
          </div>
          <div className="mt-4">
            <Link href="/dashboard/deposit" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 inline-block text-center">
              Nạp thêm
            </Link>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border">
          <h2 className="text-slate-500 text-sm font-medium">AI Credits</h2>
          <div className="text-2xl md:text-3xl font-bold mt-2 text-indigo-600">
            {credits?.find(c => c.product_code === 'AI_CREDIT')?.balance || 0} <span className="text-base md:text-lg">Tín chỉ</span>
          </div>
          <div className="mt-4">
            <button className="text-sm bg-indigo-100 text-indigo-700 px-4 py-2 rounded-md font-medium hover:bg-indigo-200">
              Mua thêm Credit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
