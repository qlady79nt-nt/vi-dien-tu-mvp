import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { envConfig } from '@/config/env'

// Mẫu Webhook body của SePay
// {
//   "id": 12345,
//   "gateway": "MBBank",
//   "transactionDate": "2023-10-10 10:10:10",
//   "accountNumber": "0123456789",
//   "code": null,
//   "content": "Nguyen Van A CK NAP_A7K29X",
//   "transferType": "in",
//   "transferAmount": 100000,
//   "accumulated": 1000000,
//   "referenceCode": "MB123456"
// }

export async function POST(request: Request) {
  try {
    // 1. Verify Webhook (Bảo mật cực kỳ quan trọng)
    const authHeader = request.headers.get('Authorization')
    // Nếu dùng SePay, thường là: 'Apikey <YOUR_SEPAY_TOKEN>'
    if (authHeader !== `Apikey ${envConfig.SEPAY_WEBHOOK_TOKEN}`) {
      console.warn('Webhook mạo danh bị chặn!')
      return NextResponse.json({ error: 'Unauthorized Webhook' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = createAdminClient() // Dùng Admin SDK vì không có session

    const { id: bank_tx_id, content, transferAmount, transferType } = body

    // Chỉ xử lý tiền vào
    if (transferType !== 'in') {
      return NextResponse.json({ message: 'Ignored' })
    }

    // Tìm mã NAP_XXXXXX hoặc NAPXXXXXX trong nội dung chuyển khoản bằng Regex
    // Thêm cờ 'i' để không phân biệt hoa thường, và '?' để dấu gạch dưới là tùy chọn
    const match = content.match(/NAP_?[a-zA-Z0-9]{6}/i)
    if (!match) {
      return NextResponse.json({ message: 'Không tìm thấy mã nạp tiền' })
    }

    // Chuẩn hóa mã: Viết HOA toàn bộ và đảm bảo có dấu gạch dưới 'NAP_'
    let depositCode = match[0].toUpperCase()
    if (!depositCode.includes('_')) {
      depositCode = depositCode.replace('NAP', 'NAP_')
    }

    // Gọi Postgres RPC để thực thi Atomic Transaction
    const { data, error } = await supabase.rpc('process_deposit', {
      p_bank_tx_id: bank_tx_id.toString(),
      p_deposit_code: depositCode,
      p_amount: transferAmount
    })

    if (error) {
      console.error('Webhook Error:', error.message)
      // Nếu lỗi là do trùng bank_tx_id (UNIQUE CONSTRAINT) -> đã xử lý rồi -> trả về 200 OK cho SePay
      if (error.message.includes('unique constraint') || error.message.includes('duplicate key')) {
        return NextResponse.json({ message: 'Already processed' })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Đã cộng tiền', data })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
