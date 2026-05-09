import { createServerClient } from '@supabase/ssr'

// Hard Guard: Tuyệt đối chặn việc chạy code này trên trình duyệt
if (typeof window !== 'undefined') {
  throw new Error('CẢNH BÁO BẢO MẬT: Admin client không được phép chạy trên Browser!')
}

export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {}
      }
    }
  )
}
