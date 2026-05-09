-- ==========================================
-- ADMIN AUDIT LOGS & ACTION
-- ==========================================

create table admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references users(id) on delete restrict,
  target_user_id uuid references users(id) on delete set null,
  action text not null, -- VD: 'ADD_BALANCE', 'REFUND', 'DEDUCT_CREDIT'
  amount bigint,
  reason text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Bật RLS
alter table admin_audit_logs enable row level security;

-- Chỉ có admin mới được quyền xem log
create policy "Admins can view audit logs" on admin_audit_logs 
for select using (
  exists (select 1 from users where users.id = auth.uid() and users.role = 'admin')
);

-- ==========================================
-- RPC 4: Admin cộng/trừ tiền (Kèm Audit Log)
-- ==========================================
create or replace function admin_adjust_balance(
  p_admin_id uuid,
  p_target_user_id uuid,
  p_amount bigint,
  p_reason text
) returns jsonb as $$
declare
  v_admin_role text;
  v_new_balance bigint;
begin
  -- 1. Verify quyền Admin một lần nữa ở cấp Database (Double Check)
  select role into v_admin_role from users where id = p_admin_id;
  if v_admin_role != 'admin' then
    raise exception 'Unauthorized: Chỉ Admin mới được thực hiện thao tác này';
  end if;

  -- 2. Cập nhật ví User
  update wallets 
  set cash_balance = cash_balance + p_amount 
  where user_id = p_target_user_id
  returning cash_balance into v_new_balance;

  -- 3. Ghi vào Admin Audit Log (Để dấu vết chống chối cãi)
  insert into admin_audit_logs (admin_id, target_user_id, action, amount, reason)
  values (p_admin_id, p_target_user_id, 'ADJUST_CASH_BALANCE', p_amount, p_reason);

  -- 4. Ghi vào Transactions (Để phía User cũng nhìn thấy dòng tiền vào ra)
  insert into transactions (user_id, type, amount, balance_after, status, source_app, metadata)
  values (p_target_user_id, case when p_amount > 0 then 'REFUND' else 'USE_CREDIT' end, p_amount, v_new_balance, 'success', 'admin_panel', jsonb_build_object('reason', p_reason, 'adjusted_by', p_admin_id));

  return jsonb_build_object('success', true, 'new_balance', v_new_balance);
end;
$$ language plpgsql security definer set search_path = public;
