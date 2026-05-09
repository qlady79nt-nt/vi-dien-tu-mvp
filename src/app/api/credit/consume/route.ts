import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Mẫu Webhook body
// {
//   "user_id": "uuid",
//   "product_code": "AI_CREDIT",
//   "amount": 1,
//   "source_app": "chatbot"
// }

export async function POST(request: Request) {
  try {
    const { user_id, product_code, amount, source_app } = await request.json()
    // Dùng Admin SDK vì API này có thể được gọi server-to-server không có session
    const supabase = createAdminClient()

    if (!user_id || !product_code || amount <= 0) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
    }

    // Lấy balance hiện tại
    const { data: currentCredit } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', user_id)
      .eq('product_code', product_code)
      .single()

    if (!currentCredit || currentCredit.balance < amount) {
      return NextResponse.json({ error: 'INSUFFICIENT_CREDITS', message: 'Không đủ credit' }, { status: 400 })
    }

    // Trừ credit
    const { data: updatedCredit, error: updateError } = await supabase
      .from('user_credits')
      .update({ balance: currentCredit.balance - amount })
      .eq('user_id', user_id)
      .eq('product_code', product_code)
      .select()
      .single()

    if (updateError) {
      // Nếu âm balance (do CHECK CONSTRAINT)
      if (updateError.message.includes('check_positive_credit')) {
         return NextResponse.json({ error: 'INSUFFICIENT_CREDITS' }, { status: 400 })
      }
      throw updateError
    }

    // Ghi log (có thể bỏ qua nếu hệ thống gọi quá nhiều, nhưng ở MVP nên ghi lại để đối soát)
    await supabase.from('transactions').insert({
      user_id,
      type: 'USE_CREDIT',
      amount: -amount,
      balance_after: updatedCredit.balance,
      status: 'success',
      source_app,
      metadata: { product_code }
    })

    return NextResponse.json({ success: true, remaining_balance: updatedCredit.balance })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
