import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { envConfig } from '@/config/env'

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('x-internal-api-key')
    if (apiKey !== envConfig.INTERNAL_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email } = await request.json()
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

    const supabase = createAdminClient()

    // 1. Tìm user_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found in wallet' }, { status: 404 })
    }

    // 2. Lấy số dư ví (Cash)
    const { data: wallet } = await supabase
      .from('wallets')
      .select('cash_balance')
      .eq('user_id', user.id)
      .single()

    // 3. Lấy số lượng AI_CREDIT
    const { data: credit } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', user.id)
      .eq('product_code', 'AI_CREDIT')
      .single()

    return NextResponse.json({
      success: true,
      wallet_balance: wallet?.cash_balance || 0,
      ai_credit: credit?.balance || 0
    })

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
