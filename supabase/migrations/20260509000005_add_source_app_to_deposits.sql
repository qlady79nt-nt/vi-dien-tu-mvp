-- Bổ sung các cột thông tin nguồn gốc vào bảng deposit_requests
ALTER TABLE deposit_requests
ADD COLUMN source_app text,
ADD COLUMN source_user_id text,
ADD COLUMN source_user_email text;

-- Bổ sung cột ID người dùng nguồn vào bảng transactions
-- (bảng transactions đã có sẵn source_app)
ALTER TABLE transactions
ADD COLUMN source_user_id text;

-- Cập nhật hàm process_deposit để chuyển thông tin nguồn gốc sang transactions
CREATE OR REPLACE FUNCTION process_deposit(
  p_bank_tx_id text,
  p_deposit_code text,
  p_amount bigint
) RETURNS jsonb AS $$
DECLARE
  v_request deposit_requests%rowtype;
  v_new_balance bigint;
BEGIN
  -- 1. Khóa Row (Idempotency)
  SELECT * INTO v_request 
  FROM deposit_requests 
  WHERE code = p_deposit_code FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deposit code không tồn tại';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Deposit request đã được xử lý hoặc hết hạn';
  END IF;

  IF v_request.amount != p_amount THEN
    RAISE EXCEPTION 'Số tiền không khớp';
  END IF;

  -- 2. Cộng tiền vào ví
  UPDATE wallets 
  SET cash_balance = cash_balance + p_amount 
  WHERE user_id = v_request.user_id
  RETURNING cash_balance INTO v_new_balance;

  -- 3. Đổi trạng thái request
  UPDATE deposit_requests 
  SET status = 'success', matched_bank_tx = p_bank_tx_id 
  WHERE id = v_request.id;

  -- 4. Ghi log transaction
  INSERT INTO transactions (
    user_id, 
    type, 
    amount, 
    balance_after, 
    status, 
    idempotency_key, 
    metadata, 
    source_app, 
    source_user_id
  )
  VALUES (
    v_request.user_id, 
    'TOPUP', 
    p_amount, 
    v_new_balance, 
    'success', 
    p_bank_tx_id, 
    jsonb_build_object('deposit_code', p_deposit_code),
    v_request.source_app,
    v_request.source_user_id
  );

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
