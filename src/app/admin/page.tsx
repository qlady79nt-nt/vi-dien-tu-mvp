import { createAdminClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = createAdminClient()

  // Thống kê tổng quan
  const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true })
  
  // Tổng tiền đang lưu thông (Dùng RPC để tối ưu Database, không kéo toàn bộ bảng về)
  const { data: totalMoney } = await supabase.rpc('get_total_system_balance')

  // 10 giao dịch gần nhất
  const { data: recentTx } = await supabase
    .from('transactions')
    .select('*, users(email)')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Thống kê hệ thống</h1>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h2 className="text-slate-400 text-sm font-medium">Tổng số User</h2>
          <div className="text-3xl font-bold mt-2">{totalUsers}</div>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h2 className="text-slate-400 text-sm font-medium">Tổng VNĐ User đang giữ</h2>
          <div className="text-3xl font-bold mt-2 text-green-400">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalMoney)}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 font-semibold">10 Giao dịch gần nhất</div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="px-6 py-3 font-medium">Thời gian</th>
              <th className="px-6 py-3 font-medium">User</th>
              <th className="px-6 py-3 font-medium">Loại</th>
              <th className="px-6 py-3 font-medium text-right">Số tiền</th>
              <th className="px-6 py-3 font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {recentTx?.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-700/50">
                <td className="px-6 py-4">{new Date(tx.created_at).toLocaleString('vi-VN')}</td>
                <td className="px-6 py-4">{tx.users?.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${tx.type === 'TOPUP' ? 'bg-blue-900/50 text-blue-400' : tx.type === 'USE_CREDIT' ? 'bg-orange-900/50 text-orange-400' : 'bg-slate-700 text-slate-300'}`}>
                    {tx.type}
                  </span>
                </td>
                <td className={`px-6 py-4 text-right font-medium ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.amount > 0 ? '+' : ''}{new Intl.NumberFormat('vi-VN').format(tx.amount)}
                </td>
                <td className="px-6 py-4">
                  <span className="text-green-400 text-xs font-medium border border-green-400/30 px-2 py-1 rounded">
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
