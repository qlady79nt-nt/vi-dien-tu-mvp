-- ==========================================
-- BẢN VÁ BẢO MẬT: BẤT BIẾN (IMMUTABLE) VÀ FORENSIC DATA
-- ==========================================

-- 1. Thêm các trường truy vết chuyên sâu (Forensic Data)
ALTER TABLE admin_audit_logs
ADD COLUMN IF NOT EXISTS balance_before bigint,
ADD COLUMN IF NOT EXISTS balance_after bigint,
ADD COLUMN IF NOT EXISTS request_id text unique, -- Chống admin click đúp (spam refund)
ADD COLUMN IF NOT EXISTS source text default 'admin_panel',
ADD COLUMN IF NOT EXISTS ip_address text;

-- 2. Mở rộng Role để chuẩn bị cho chia quyền (finance)
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_role;
ALTER TABLE users ADD CONSTRAINT check_role CHECK (role IN ('user', 'admin', 'finance', 'support'));

-- 3. Đóng băng bảng Audit Log (Cấm UPDATE và DELETE)
-- Chỉ cho phép INSERT. Đã ghi sổ là không thể sửa đổi (Append-only).
CREATE OR REPLACE FUNCTION prevent_audit_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable. UPDATE or DELETE operations are strictly forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_immutable_audit_logs ON admin_audit_logs;
CREATE TRIGGER enforce_immutable_audit_logs
BEFORE UPDATE OR DELETE ON admin_audit_logs
FOR EACH ROW EXECUTE PROCEDURE prevent_audit_log_tampering();

-- 4. Cập nhật lại RPC Adjust Balance để hỗ trợ Forensic Data
CREATE OR REPLACE FUNCTION admin_adjust_balance(
  p_admin_id uuid,
  p_target_user_id uuid,
  p_amount bigint,
  p_reason text,
  p_request_id text,
  p_ip_address text,
  p_source text default 'admin_panel'
) RETURNS jsonb AS $$
DECLARE
  v_admin_role text;
  v_balance_before bigint;
  v_balance_after bigint;
BEGIN
  -- 1. Khóa bảng Wallet và lấy balance hiện tại (Chống Race Condition nếu User đang mua hàng cùng lúc)
  SELECT cash_balance INTO v_balance_before 
  FROM wallets 
  WHERE user_id = p_target_user_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet không tồn tại';
  END IF;

  -- Verify quyền Admin/Finance
  SELECT role INTO v_admin_role FROM users WHERE id = p_admin_id;
  IF v_admin_role NOT IN ('admin', 'finance') THEN
    RAISE EXCEPTION 'Unauthorized: Không có quyền tài chính';
  END IF;

  -- 2. Tính toán & Cập nhật ví User
  v_balance_after := v_balance_before + p_amount;
  -- Không cho phép trừ quá tay thành âm tiền
  IF v_balance_after < 0 THEN
    RAISE EXCEPTION 'Số dư không đủ để thực hiện thao tác trừ';
  END IF;
  
  UPDATE wallets 
  SET cash_balance = v_balance_after 
  WHERE user_id = p_target_user_id;

  -- 3. Ghi vào Admin Audit Log (với Idempotency Key chống spam click)
  -- Lỗi Unique Constraint sẽ văng ra ngay nếu request_id bị trùng
  INSERT INTO admin_audit_logs (
    admin_id, target_user_id, action, amount, reason, 
    balance_before, balance_after, request_id, ip_address, source
  )
  VALUES (
    p_admin_id, p_target_user_id, 'ADJUST_CASH_BALANCE', p_amount, p_reason, 
    v_balance_before, v_balance_after, p_request_id, p_ip_address, p_source
  );

  -- 4. Ghi vào Transactions
  INSERT INTO transactions (
    user_id, type, amount, balance_after, status, source_app, idempotency_key, metadata
  )
  VALUES (
    p_target_user_id, 
    CASE WHEN p_amount > 0 THEN 'REFUND' ELSE 'USE_CREDIT' END, 
    p_amount, v_balance_after, 'success', p_source, p_request_id,
    jsonb_build_object('reason', p_reason, 'adjusted_by', p_admin_id, 'ip', p_ip_address)
  );

  RETURN jsonb_build_object('success', true, 'new_balance', v_balance_after);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
