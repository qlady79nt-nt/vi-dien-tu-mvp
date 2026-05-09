import { createAdminClient } from '@/lib/supabase/admin'
import { Users, Wallet, ArrowUpRight, ArrowDownRight, Clock, ShieldCheck, Zap } from 'lucide-react'

export default async function AdminPage() {
  const supabase = createAdminClient()

  // Thống kê tổng quan
  const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true })
  
  // Tổng tiền đang lưu thông
  const { data: totalMoney } = await supabase.rpc('get_total_system_balance')

  // 10 giao dịch gần nhất
  const { data: recentTx } = await supabase
    .from('transactions')
    .select('*, users(email)')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Thống kê hệ thống</h1>
        <p className="text-slate-400">Tổng quan tình hình tài chính và hoạt động của toàn bộ nền tảng.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Tổng User */}
        <div className="group relative bg-[#111113]/80 backdrop-blur-xl p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all duration-500 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex justify-between items-start">
            <div>
              <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Tổng số User</h2>
              <div className="text-4xl font-black text-white">{totalUsers}</div>
            </div>
            <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-400 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <Users size={24} />
            </div>
          </div>
          <div className="mt-6 flex items-center text-xs text-blue-400 bg-blue-500/10 w-fit px-3 py-1 rounded-full">
            <ArrowUpRight size={14} className="mr-1" />
            <span>Tăng trưởng ổn định</span>
          </div>
        </div>

        {/* Card 2: Tổng Tiền Lưu Thông */}
        <div className="group relative bg-[#111113]/80 backdrop-blur-xl p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all duration-500 overflow-hidden lg:col-span-2">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full group-hover:bg-emerald-500/20 transition-colors duration-700"></div>
          <div className="relative flex justify-between items-start">
            <div>
              <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Tổng VNĐ User đang giữ</h2>
              <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 tracking-tight">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalMoney || 0)}
              </div>
            </div>
            <div className="bg-emerald-500/10 p-4 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <Wallet size={32} />
            </div>
          </div>
          <div className="mt-6 flex items-center text-xs text-emerald-400 bg-emerald-500/10 w-fit px-3 py-1 rounded-full border border-emerald-500/20">
            <ShieldCheck size={14} className="mr-1" />
            <span>Đã đồng bộ & Đối soát</span>
          </div>
        </div>
      </div>

      {/* Bảng Giao Dịch */}
      <div className="bg-[#111113]/80 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock size={18} className="text-slate-400" />
            10 Giao dịch gần nhất
          </h2>
          <div className="text-xs font-medium px-3 py-1 bg-white/5 rounded-full text-slate-300 border border-white/5">
            Cập nhật theo thời gian thực
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/[0.02] text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-8 py-5 font-semibold">Thời gian</th>
                <th className="px-8 py-5 font-semibold">Khách hàng</th>
                <th className="px-8 py-5 font-semibold">Loại GD</th>
                <th className="px-8 py-5 font-semibold text-right">Số tiền</th>
                <th className="px-8 py-5 font-semibold">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentTx?.map((tx) => {
                const isPositive = tx.amount > 0;
                return (
                  <tr key={tx.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-8 py-5 text-slate-400">
                      {new Date(tx.created_at).toLocaleString('vi-VN', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-8 py-5 font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                          {tx.users?.email?.charAt(0).toUpperCase()}
                        </div>
                        {tx.users?.email}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        tx.type === 'TOPUP' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : tx.type === 'BUY_CREDIT' 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                            : tx.type === 'USE_CREDIT'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {tx.type === 'TOPUP' && <ArrowDownRight size={12} />}
                        {tx.type === 'BUY_CREDIT' && <ArrowUpRight size={12} />}
                        {tx.type === 'BONUS' && <Zap size={12} />}
                        {tx.type}
                      </span>
                    </td>
                    <td className={`px-8 py-5 text-right font-bold text-base ${isPositive ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {isPositive ? '+' : ''}{new Intl.NumberFormat('vi-VN').format(tx.amount)} ₫
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        {tx.status}
                      </div>
                    </td>
                  </tr>
                )
              })}
              
              {(!recentTx || recentTx.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-500">
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
