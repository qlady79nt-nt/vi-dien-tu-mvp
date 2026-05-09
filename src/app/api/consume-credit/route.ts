import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { envConfig } from '@/config/env'

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('x-internal-api-key')
    if (apiKey !== envConfig.INTERNAL_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, consume_amount } = await request.json()
    if (!email || !consume_amount) return NextResponse.json({ error: 'Missing email or consume_amount' }, { status: 400 })

    const supabase = createAdminClient()

    // 1. Tìm user_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 2. Gọi RPC trừ credit
    const { data, error } = await supabase.rpc('consume_credit', {
      p_user_id: user.id,
      p_product_code: 'AI_CREDIT',
      p_consume_amount: consume_amount
    })

    if (error) {
      // Bắt lỗi constraint khi không đủ Credit
      if (error.message.includes('check_positive_credit') || error.message.includes('violates check constraint')) {
        return NextResponse.json({ success: false, message: 'Hết AI Credit' })
      }
      console.error('Consume credit error:', error.message)
      return NextResponse.json({ success: false, message: error.message })
    }

    return NextResponse.json({
      success: true,
      message: 'Consume credit success',
      data
    })

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
