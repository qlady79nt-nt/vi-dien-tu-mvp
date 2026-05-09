-- ==========================================
-- BẢN VÁ TỐI ƯU HIỆU SUẤT (INDEXING)
-- ==========================================

-- Tạo Index cho các cột thường xuyên dùng để sắp xếp (ORDER BY) và lọc (WHERE)
-- Giúp các truy vấn Admin Dashboard hoặc Lịch sử giao dịch nhanh gấp hàng trăm lần khi có hàng triệu Row.

CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_deposit_requests_code ON public.deposit_requests(code);
