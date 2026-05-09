import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { envConfig } from '@/config/env'

export async function POST(request: Request) {
  try {
    const { amount } = await request.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!amount || amount < 10000) {
      return NextResponse.json({ error: 'Số tiền tối thiểu 10.000đ' }, { status: 400 })
    }

    // Tạo mã ngẫu nhiên: NAP_ + 6 ký tự
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
    const code = `NAP_${randomStr}`

    // Insert vào bảng deposit_requests
    // Thời hạn 15 phút
    const expired_at = new Date(Date.now() + 15 * 60000).toISOString()

    const { error } = await supabase
      .from('deposit_requests')
      .insert({
        user_id: user.id,
        code,
        amount,
        status: 'pending',
        expired_at
      })

    if (error) throw error

    // Tạo QR URL (Ví dụ dùng vietqr.io hoặc sepay)
    // Lấy thông tin cấu hình từ env.ts (đã được validate lúc startup)
    const qrUrl = `https://img.vietqr.io/image/${envConfig.BANK_BIN}-${envConfig.BANK_ACCOUNT_NUMBER}-compact2.jpg?amount=${amount}&addInfo=${code}`

    return NextResponse.json({
      success: true,
      code,
      amount,
      qrUrl,
      expired_at
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
