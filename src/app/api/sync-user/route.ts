import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { envConfig } from '@/config/env'

export async function POST(request: Request) {
  try {
    // 1. Xác thực bảo mật: Chỉ cho phép Chatbot Backend gọi bằng INTERNAL_API_KEY
    const apiKey = request.headers.get('x-internal-api-key')
    if (apiKey !== envConfig.INTERNAL_API_KEY) {
      console.warn('Cảnh báo: Có luồng truy cập trái phép vào API Sync User')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Yêu cầu cung cấp email và password' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 2. Gọi Supabase Auth Admin để tạo tài khoản
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Tự động xác thực email để user vào được luôn
    })

    // 3. Xử lý lỗi (Nếu user đã tồn tại thì báo success luôn để không làm gián đoạn)
    if (error) {
      if (error.message.toLowerCase().includes('already exists') || error.message.toLowerCase().includes('already registered')) {
        return NextResponse.json({ success: true, message: 'User đã tồn tại bên Wallet, bỏ qua.' })
      }
      
      console.error('Lỗi khi đồng bộ user sang Wallet:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Lưu ý: Sau khi tạo auth thành công, Trigger Postgres "on_auth_user_created"
    // sẽ tự động chạy ngầm ở Database để INSERT bảng "users", bảng "wallets", và "user_credits" (AI_CREDIT).

    return NextResponse.json({ success: true, message: 'Đồng bộ user và tạo ví điện tử thành công!' })

  } catch (error: any) {
    console.error('Lỗi hệ thống API Sync User:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
