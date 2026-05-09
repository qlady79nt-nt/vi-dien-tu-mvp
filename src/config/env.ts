// src/config/env.ts

const getEnvVars = () => {
  const BANK_ACCOUNT_NUMBER = process.env.BANK_ACCOUNT_NUMBER
  const BANK_BIN = process.env.BANK_BIN
  const SEPAY_WEBHOOK_TOKEN = process.env.SEPAY_WEBHOOK_TOKEN

  if (!BANK_ACCOUNT_NUMBER) {
    throw new Error('Thiếu cấu hình môi trường: BANK_ACCOUNT_NUMBER')
  }

  if (!BANK_BIN) {
    throw new Error('Thiếu cấu hình môi trường: BANK_BIN')
  }

  if (!SEPAY_WEBHOOK_TOKEN) {
    throw new Error('Thiếu cấu hình môi trường: SEPAY_WEBHOOK_TOKEN')
  }

  return {
    BANK_ACCOUNT_NUMBER,
    BANK_BIN,
    SEPAY_WEBHOOK_TOKEN
  }
}

export const envConfig = getEnvVars()
