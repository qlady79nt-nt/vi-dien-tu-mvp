-- ==========================================
-- FILE TỔNG HỢP TOÀN BỘ RLS POLICIES (BẢO MẬT)
-- Dùng để quản lý tập trung, dễ dàng audit và nâng cấp sau này
-- ==========================================

-- 1. BẢNG USERS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);

-- 2. BẢNG WALLETS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own wallet" ON wallets;
CREATE POLICY "Users can view own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);

-- 3. BẢNG USER_CREDITS
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own credits" ON user_credits;
CREATE POLICY "Users can view own credits" ON user_credits FOR SELECT USING (auth.uid() = user_id);

-- 4. BẢNG TRANSACTIONS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own tx" ON transactions;
CREATE POLICY "Users can view own tx" ON transactions FOR SELECT USING (auth.uid() = user_id);

-- 5. BẢNG DEPOSIT_REQUESTS
ALTER TABLE deposit_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own deposits" ON deposit_requests;
CREATE POLICY "Users can view own deposits" ON deposit_requests FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own deposits" ON deposit_requests;
CREATE POLICY "Users can insert own deposits" ON deposit_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. BẢNG ADMIN_AUDIT_LOGS
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view audit logs" ON admin_audit_logs;
CREATE POLICY "Admins can view audit logs" ON admin_audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'finance'))
);

-- ==========================================
-- GHI CHÚ QUAN TRỌNG VỀ RLS Ở DỰ ÁN NÀY:
-- ==========================================
-- Kiến trúc Zero-Trust hiện tại:
-- * SELECT: Chỉ cho phép CHÍNH CHỦ xem (Riêng admin_audit_logs thì Admin được xem).
-- * INSERT: Bảng deposit_requests cho phép User tự insert. Các bảng khác (wallets, transactions...) cấm tuyệt đối, chỉ Insert thông qua RPC/Trigger.
-- * UPDATE: Cấm tuyệt đối toàn bộ Frontend. Mọi thao tác đổi số dư, đổi trạng thái phải đi qua RPC (có đính kèm Service Role / Security Definer).
-- * DELETE: Cấm tuyệt đối. Toàn bộ dữ liệu tài chính là Append-Only (Chỉ được thêm mới).
