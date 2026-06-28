import { createAdminClient } from '@/lib/supabase/admin'
import { Users, Wallet, ArrowUpRight, ArrowDownRight, Clock, ShieldCheck, Zap } from 'lucide-react'

export default async function AdminPage() {
  const supabase = createAdminClient()

  // Thống kê tổng quan (Đếm chi tiết từ Auth Admin để lấy source)
  const { data: authData } = await supabase.auth.admin.listUsers()
  const allUsers = authData?.users || []
  const totalUsers = allUsers.length
  const chatbotUsers = allUsers.filter(u => u.user_metadata?.source === 'chatbot').length
  const walletUsers = totalUsers - chatbotUsers
  
  // Tổng tiền đang lưu thông
  const { data: totalMoney } = await supabase.rpc('get_total_system_balance')

  // Tổng nạp theo ứng dụng
  const { data: topupTx } = await supabase
    .from('transactions')
    .select('source_app, amount')
    .eq('type', 'TOPUP')
    .eq('status', 'success')

  const revenueByApp = topupTx?.reduce((acc: Record<string, number>, tx) => {
    const app = tx.source_app || 'wallet'
    acc[app] = (acc[app] || 0) + tx.amount
    return acc
  }, {}) || {}

  // 10 giao dịch gần nhất
  const { data: recentTx } = await supabase
    .from('transactions')
    .select('*, users(email)')
    .order('created_at', { ascending: false })
    .limit(10)

  // Bảng danh sách User kèm Ví tiền và Credit
  const { data: dbUsers } = await supabase
    .from('users')
    .select(`
      id,
      email,
      created_at,
      wallets(cash_balance),
      user_credits(balance, product_code)
    `)
    .order('created_at', { ascending: false })

  const mergedUsers = dbUsers?.map(dbU => {
    const authU = allUsers.find(u => u.id === dbU.id)
    
    const cash = Array.isArray(dbU.wallets) ? dbU.wallets[0]?.cash_balance : (dbU.wallets as any)?.cash_balance
    const creditsArr = Array.isArray(dbU.user_credits) ? dbU.user_credits : []
    const ai_credit = creditsArr.find((c: any) => c.product_code === 'AI_CREDIT')?.balance || 0

    return {
      id: dbU.id,
      email: dbU.email,
      created_at: dbU.created_at,
      source: authU?.user_metadata?.source || 'wallet',
      cash: cash || 0,
      ai_credit: ai_credit
    }
  }) || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">Thống kê hệ thống</h1>
        <p className="text-slate-500">Tổng quan tình hình tài chính và hoạt động của toàn bộ nền tảng.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Tổng User */}
        <div className="group relative bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-500 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex justify-between items-start">
            <div>
              <h2 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Tổng số User</h2>
              <div className="text-4xl font-black text-slate-900">{totalUsers}</div>
            </div>
            <div className="bg-blue-100 p-3 rounded-2xl text-blue-600 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <Users size={24} />
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <div className="flex items-center text-xs font-semibold text-blue-700 bg-blue-50 w-fit px-3 py-1 rounded-full border border-blue-100">
              <span>Đăng ký trực tiếp (Ví): {walletUsers}</span>
            </div>
            <div className="flex items-center text-xs font-semibold text-purple-700 bg-purple-50 w-fit px-3 py-1 rounded-full border border-purple-100">
              <span>Đồng bộ từ Chatbot: {chatbotUsers}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Tổng Tiền Lưu Thông */}
        <div className="group relative bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-500 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-100/50 blur-[80px] rounded-full group-hover:bg-emerald-200/50 transition-colors duration-700"></div>
          <div className="relative flex justify-between items-start">
            <div>
              <h2 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Tổng VNĐ đang giữ</h2>
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 tracking-tight">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalMoney || 0)}
              </div>
            </div>
            <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform duration-300 shadow-[0_4px_20px_rgba(16,185,129,0.15)]">
              <Wallet size={32} />
            </div>
          </div>
          <div className="mt-6 flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 w-fit px-3 py-1 rounded-full border border-emerald-200">
            <ShieldCheck size={14} className="mr-1" />
            <span>Đã đồng bộ & Đối soát</span>
          </div>
        </div>

        {/* Card 3: Doanh thu theo App */}
        <div className="group relative bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-500 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <h2 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-4">Tổng nạp theo ứng dụng</h2>
            <div className="space-y-3">
              {Object.entries(revenueByApp).map(([app, amount]) => (
                <div key={app} className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-slate-700 capitalize px-2 py-1 bg-slate-100 rounded-md">{app}</span>
                  <span className="font-bold text-slate-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount as number)}</span>
                </div>
              ))}
              {Object.keys(revenueByApp).length === 0 && (
                <div className="text-sm text-slate-500">Chưa có dữ liệu nạp tiền</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bảng Quản lý User */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users size={18} className="text-slate-500" />
            Danh sách Khách hàng
          </h2>
          <div className="text-xs font-bold px-3 py-1 bg-blue-50 rounded-full text-blue-600 border border-blue-200">
            Tổng cộng: {totalUsers}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-8 py-5">Khách hàng</th>
                <th className="px-8 py-5">Ngày tham gia</th>
                <th className="px-8 py-5">Nguồn gốc</th>
                <th className="px-8 py-5 text-right">Ví VNĐ</th>
                <th className="px-8 py-5 text-right">AI Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mergedUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-5 font-semibold text-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 flex items-center justify-center text-xs font-bold text-indigo-700 shadow-inner">
                        {u.email?.charAt(0).toUpperCase()}
                      </div>
                      {u.email}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-slate-500 font-medium">
                    {new Date(u.created_at).toLocaleString('vi-VN', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="px-8 py-5">
                    {u.source === 'chatbot' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200">
                        Chatbot Sync
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200">
                        Wallet Direct
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right font-black text-emerald-600">
                    {new Intl.NumberFormat('vi-VN').format(u.cash)} ₫
                  </td>
                  <td className="px-8 py-5 text-right font-black text-rose-600">
                    {new Intl.NumberFormat('vi-VN').format(u.ai_credit)}
                  </td>
                </tr>
              ))}
              
              {mergedUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-500 font-medium">
                    Chưa có khách hàng nào trong hệ thống.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bảng Giao Dịch */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock size={18} className="text-slate-500" />
            10 Giao dịch gần nhất
          </h2>
          <div className="text-xs font-bold px-3 py-1 bg-slate-100 rounded-full text-slate-600 border border-slate-200">
            Cập nhật theo thời gian thực
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-8 py-5">Thời gian</th>
                <th className="px-8 py-5">Khách hàng & Nguồn</th>
                <th className="px-8 py-5">Loại GD</th>
                <th className="px-8 py-5 text-right">Số tiền</th>
                <th className="px-8 py-5">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTx?.map((tx) => {
                const isPositive = tx.amount > 0;
                return (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-5 text-slate-500 font-medium">
                      {new Date(tx.created_at).toLocaleString('vi-VN', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-8 py-5 font-semibold text-slate-800">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 shadow-inner">
                            {tx.users?.email?.charAt(0).toUpperCase()}
                          </div>
                          <span>{tx.users?.email}</span>
                        </div>
                        {tx.source_app && (
                          <div className="text-xs text-slate-500 mt-1 pl-8">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">Nguồn: {tx.source_app}</span>
                            {tx.source_user_id && <span className="ml-2">ID: {tx.source_user_id}</span>}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                        tx.type === 'TOPUP' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : tx.type === 'BUY_CREDIT' 
                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                            : tx.type === 'USE_CREDIT'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {tx.type === 'TOPUP' && <ArrowDownRight size={12} />}
                        {tx.type === 'BUY_CREDIT' && <ArrowUpRight size={12} />}
                        {tx.type === 'BONUS' && <Zap size={12} />}
                        {tx.type}
                      </span>
                    </td>
                    <td className={`px-8 py-5 text-right font-black text-base ${isPositive ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {isPositive ? '+' : ''}{new Intl.NumberFormat('vi-VN').format(tx.amount)} ₫
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider bg-emerald-50 w-fit px-2.5 py-1 rounded-md border border-emerald-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        {tx.status}
                      </div>
                    </td>
                  </tr>
                )
              })}
              
              {(!recentTx || recentTx.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-500 font-medium">
                    Chưa có giao dịch nào trong hệ thống.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
