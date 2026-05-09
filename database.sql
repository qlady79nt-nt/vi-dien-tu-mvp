-- ==========================================
-- GIAI ĐOẠN 1: TẠO BẢNG & RLS
-- ==========================================

-- 1. Bảng users
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text default 'user' constraint check_role check (role in ('user', 'admin', 'staff')),
  created_at timestamptz default now()
);

-- Bật RLS
alter table users enable row level security;
create policy "Users can view own data" on users for select using (auth.uid() = id);

-- 2. Bảng wallets
create table wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  cash_balance bigint default 0 constraint check_positive_balance check (cash_balance >= 0),
  created_at timestamptz default now(),
  unique(user_id)
);

alter table wallets enable row level security;
create policy "Users can view own wallet" on wallets for select using (auth.uid() = user_id);

-- 3. Bảng credit_products
create table credit_products (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  price_per_unit bigint not null
);

-- 4. Bảng user_credits
create table user_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  product_code text not null references credit_products(code),
  balance bigint default 0 constraint check_positive_credit check (balance >= 0),
  unique(user_id, product_code)
);

alter table user_credits enable row level security;
create policy "Users can view own credits" on user_credits for select using (auth.uid() = user_id);

-- 5. Bảng transactions
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  type text constraint check_type check (type in ('TOPUP', 'BUY_CREDIT', 'USE_CREDIT', 'REFUND', 'BONUS')),
  amount bigint not null,
  balance_after bigint, -- Số dư ví CỦA LOẠI TIỀN (Cash hoặc Credit) sau giao dịch
  status text default 'success',
  source_app text,
  reference_id text,
  metadata jsonb,
  idempotency_key text unique, -- Rất quan trọng chống double webhook
  created_at timestamptz default now()
);

alter table transactions enable row level security;
create policy "Users can view own tx" on transactions for select using (auth.uid() = user_id);

-- 6. Bảng deposit_requests
create table deposit_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  code text unique not null,
  amount bigint not null,
  status text default 'pending' constraint check_status check (status in ('pending', 'success', 'failed', 'expired')),
  expired_at timestamptz not null,
  matched_bank_tx text,
  created_at timestamptz default now()
);

alter table deposit_requests enable row level security;
create policy "Users can view own deposits" on deposit_requests for select using (auth.uid() = user_id);


-- ==========================================
-- GIAI ĐOẠN 2: POSTGRES TRIGGERS
-- ==========================================
-- Tự động tạo user và wallet khi đăng ký Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Tạo user
  insert into public.users (id, email)
  values (new.id, new.email);
  
  -- Tạo wallet (0đ)
  insert into public.wallets (user_id, cash_balance)
  values (new.id, 0);

  -- Khởi tạo sẵn AI_CREDIT bằng 0 (chỉ tạo nếu product tồn tại)
  if exists (select 1 from public.credit_products where code = 'AI_CREDIT') then
    insert into public.user_credits (user_id, product_code, balance)
    values (new.id, 'AI_CREDIT', 0);
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger chạy sau khi auth.users được insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==========================================
-- GIAI ĐOẠN 3: POSTGRES RPC (ATOMIC TRANSACTIONS)
-- ==========================================

-- RPC 1: Xử lý Webhook cộng tiền (Atomic)
create or replace function process_deposit(
  p_bank_tx_id text,
  p_deposit_code text,
  p_amount bigint
) returns jsonb as $$
declare
  v_request deposit_requests%rowtype;
  v_new_balance bigint;
begin
  -- 1. Khóa Row (Idempotency: nếu bank_tx_id trùng sẽ văng lỗi UNIQUE CONSTRAINT trước khi vào đây)
  
  -- Tìm và khóa request đang pending
  select * into v_request 
  from deposit_requests 
  where code = p_deposit_code for update;

  if not found then
    raise exception 'Deposit code không tồn tại';
  end if;

  if v_request.status != 'pending' then
    raise exception 'Deposit request đã được xử lý hoặc hết hạn';
  end if;

  if v_request.amount != p_amount then
    raise exception 'Số tiền không khớp';
  end if;

  -- 2. Cộng tiền vào ví
  update wallets 
  set cash_balance = cash_balance + p_amount 
  where user_id = v_request.user_id
  returning cash_balance into v_new_balance;

  -- 3. Đổi trạng thái request
  update deposit_requests 
  set status = 'success', matched_bank_tx = p_bank_tx_id 
  where id = v_request.id;

  -- 4. Ghi log transaction (dùng p_bank_tx_id làm idempotency_key)
  insert into transactions (user_id, type, amount, balance_after, status, idempotency_key, metadata)
  values (v_request.user_id, 'TOPUP', p_amount, v_new_balance, 'success', p_bank_tx_id, jsonb_build_object('deposit_code', p_deposit_code));

  return jsonb_build_object('success', true, 'new_balance', v_new_balance);
end;
$$ language plpgsql security definer;


-- RPC 2: Mua Credit bằng Tiền mặt (Atomic)
create or replace function buy_credit(
  p_user_id uuid,
  p_product_code text,
  p_quantity bigint
) returns jsonb as $$
declare
  v_price_per_unit bigint;
  v_total_cost bigint;
  v_new_cash_balance bigint;
  v_new_credit_balance bigint;
begin
  -- 1. Lấy giá
  select price_per_unit into v_price_per_unit from credit_products where code = p_product_code;
  if not found then raise exception 'Mã sản phẩm không tồn tại'; end if;
  
  v_total_cost := v_price_per_unit * p_quantity;

  -- 2. Trừ tiền (nếu không đủ tiền, CHECK constraint (cash_balance >= 0) sẽ throw error và tự Rollback)
  update wallets 
  set cash_balance = cash_balance - v_total_cost 
  where user_id = p_user_id
  returning cash_balance into v_new_cash_balance;

  -- 3. Cộng credit
  update user_credits 
  set balance = balance + p_quantity 
  where user_id = p_user_id and product_code = p_product_code
  returning balance into v_new_credit_balance;

  -- 4. Ghi log: trừ tiền
  insert into transactions (user_id, type, amount, balance_after, status, metadata)
  values (p_user_id, 'BUY_CREDIT', -v_total_cost, v_new_cash_balance, 'success', jsonb_build_object('action', 'deduct_cash', 'product', p_product_code, 'qty', p_quantity));

  -- 5. Ghi log: nhận credit (có thể tạo type là BONUS/CREDIT_ADD)
  insert into transactions (user_id, type, amount, balance_after, status, metadata)
  values (p_user_id, 'BONUS', p_quantity, v_new_credit_balance, 'success', jsonb_build_object('action', 'add_credit', 'product', p_product_code));

  return jsonb_build_object('success', true, 'new_cash', v_new_cash_balance, 'new_credit', v_new_credit_balance);
end;
$$ language plpgsql security definer;

-- Insert data test cho product
-- Insert data test cho product
insert into credit_products (code, name, price_per_unit) values ('AI_CREDIT', 'AI Generation Credit', 1000) on conflict do nothing;

-- ==========================================
-- GIAI ĐOẠN 4: ADMIN RPCS
-- ==========================================
-- RPC 3: Lấy tổng tiền toàn hệ thống (Dành cho Admin Dashboard)
create or replace function get_total_system_balance() returns bigint as $$
declare
  v_total bigint;
begin
  select coalesce(sum(cash_balance), 0) into v_total from wallets;
  return v_total;
end;
$$ language plpgsql security definer;
