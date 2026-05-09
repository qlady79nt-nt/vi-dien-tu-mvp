// src/config/env.ts

const getEnvVars = () => {
  const BANK_ACCOUNT_NUMBER = process.env.BANK_ACCOUNT_NUMBER
  const BANK_BIN = process.env.BANK_BIN
  const SEPAY_WEBHOOK_TOKEN = process.env.SEPAY_WEBHOOK_TOKEN
  const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY

  if (!BANK_ACCOUNT_NUMBER) {
    throw new Error('Thiếu cấu hình môi trường: BANK_ACCOUNT_NUMBER')
  }

  if (!BANK_BIN) {
    throw new Error('Thiếu cấu hình môi trường: BANK_BIN')
  }

  if (!SEPAY_WEBHOOK_TOKEN) {
    throw new Error('Thiếu cấu hình môi trường: SEPAY_WEBHOOK_TOKEN')
  }

  if (!INTERNAL_API_KEY) {
    throw new Error('Thiếu cấu hình môi trường: INTERNAL_API_KEY')
  }

  return {
    BANK_ACCOUNT_NUMBER,
    BANK_BIN,
    SEPAY_WEBHOOK_TOKEN,
    INTERNAL_API_KEY
  }
}

// Bọc bằng hàm Proxy để CHỈ kích hoạt kiểm tra biến môi trường lúc Runtime (lúc code chạy thật),
// chứ không kiểm tra lúc Vercel đang Build (tránh lỗi module evaluation)
export const envConfig = new Proxy({} as ReturnType<typeof getEnvVars>, {
  get: (target, prop) => {
    return getEnvVars()[prop as keyof ReturnType<typeof getEnvVars>];
  }
});
