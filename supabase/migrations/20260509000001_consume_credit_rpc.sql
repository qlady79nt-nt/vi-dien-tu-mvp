-- RPC: Consume AI Credit (Atomic Transaction)
create or replace function consume_credit(
  p_user_id uuid,
  p_product_code text,
  p_consume_amount bigint
) returns jsonb as $$
declare
  v_new_credit_balance bigint;
begin
  -- 1. Trừ credit (Nếu balance < consume_amount, constraint check_positive_credit sẽ văng lỗi)
  update user_credits 
  set balance = balance - p_consume_amount 
  where user_id = p_user_id and product_code = p_product_code
  returning balance into v_new_credit_balance;

  if not found then
    raise exception 'Không tìm thấy loại Credit này của User';
  end if;

  -- 2. Ghi log transaction (Loại: USE_CREDIT)
  insert into transactions (user_id, type, amount, balance_after, status, metadata)
  values (p_user_id, 'USE_CREDIT', -p_consume_amount, v_new_credit_balance, 'success', jsonb_build_object('action', 'consume', 'product', p_product_code));

  return jsonb_build_object('success', true, 'new_credit', v_new_credit_balance);
end;
$$ language plpgsql security definer set search_path = public;
