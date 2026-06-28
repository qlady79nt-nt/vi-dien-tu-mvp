import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { envConfig } from '@/config/env'

export async function POST(request: Request) {
  try {
    // 1. Xác thực bảo mật: Chỉ cho phép Backend của các Web App vệ tinh gọi
    const apiKey = request.headers.get('x-internal-api-key')
    if (apiKey !== envConfig.INTERNAL_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, amount, sourceApp, sourceUserId, sourceUserEmail } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    if (!amount || amount < 10000) {
      return NextResponse.json({ error: 'Số tiền tối thiểu 10.000đ' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 2. Tìm user_id theo email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found in wallet system' }, { status: 404 })
    }

    // 3. Tạo mã nạp tiền ngẫu nhiên
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
    const code = `NAP_${randomStr}`
    const expired_at = new Date(Date.now() + 15 * 60000).toISOString()

    // 4. Lưu yêu cầu nạp tiền vào database
    const { error: insertError } = await supabase
      .from('deposit_requests')
      .insert({
        user_id: user.id,
        code,
        amount,
        status: 'pending',
        expired_at,
        source_app: sourceApp || 'wallet',
        source_user_id: sourceUserId || null,
        source_user_email: sourceUserEmail || null
      })

    if (insertError) throw insertError

    // 5. Tạo link ảnh mã QR
    const qrUrl = `https://img.vietqr.io/image/${envConfig.BANK_BIN}-${envConfig.BANK_ACCOUNT_NUMBER}-compact2.jpg?amount=${amount}&addInfo=${code}`

    return NextResponse.json({
      success: true,
      code,
      amount,
      qrUrl,
      expired_at
    })

  } catch (error: any) {
    console.error('Lỗi API create-internal deposit:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
