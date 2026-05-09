import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { product_code, quantity } = await request.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!product_code || quantity <= 0) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
    }

    // Gọi Postgres RPC để thực thi Atomic Transaction
    const { data, error } = await supabase.rpc('buy_credit', {
      p_user_id: user.id,
      p_product_code: product_code,
      p_quantity: quantity
    })

    if (error) {
      // Nếu lỗi do CHECK CONSTRAINT (cash_balance >= 0)
      if (error.message.includes('check_positive_balance')) {
        return NextResponse.json({ error: 'Số dư không đủ để mua' }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
