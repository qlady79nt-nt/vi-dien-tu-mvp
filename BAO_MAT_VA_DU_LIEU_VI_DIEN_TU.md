# CHI TIẾT CƠ CHẾ BẢO MẬT & DỮ LIỆU HỆ THỐNG VÍ ĐIỆN TỬ

Tài liệu này đi sâu vào các khía cạnh kỹ thuật, mã nguồn và quy trình bảo mật được áp dụng trong hệ thống Ví Điện Tử MVP.

---

## 1. CƠ CHẾ BẢO MẬT TẦNG DATABASE (RLS)

Hệ thống sử dụng **Supabase Row Level Security (RLS)** để đảm bảo dữ liệu của mỗi người dùng được cô lập hoàn toàn.

### Quy tắc chung:
- **Người dùng thường**: Chỉ có quyền `SELECT` dữ liệu thuộc về chính mình. Cấm tuyệt đối `UPDATE`, `DELETE` trên mọi bảng tài chính.
- **Admin/Finance**: Có quyền `SELECT` trên toàn bộ bảng `admin_audit_logs` để kiểm tra.
- **Hệ thống (RPC)**: Các thao tác thay đổi số dư chỉ được thực hiện thông qua các hàm Server-side có quyền cao (Security Definer).

### Code ví dụ (RLS Policies):
```sql
-- Chặn truy cập trái phép vào ví
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);

-- Chặn người dùng tự sửa đổi số dư
-- (Mặc định khi enable RLS mà không tạo policy UPDATE thì mọi quyền UPDATE bị cấm)
```

---

## 2. BẢO MẬT GIAO DỊCH (ATOMICITY & IDEMPOTENCY)

Để ngăn chặn lỗi mất mát tiền hoặc nạp tiền ảo, hệ thống sử dụng các hàm **Postgres RPC** với cơ chế bảo vệ nghiêm ngặt.

### Cơ chế chống Race Condition:
Sử dụng lệnh `FOR UPDATE` để khóa dòng dữ liệu trong khi đang xử lý giao dịch.
```sql
-- Trong hàm xử lý nạp tiền (RPC)
SELECT * INTO v_request 
FROM deposit_requests 
WHERE code = p_deposit_code FOR UPDATE; -- Khóa yêu cầu nạp tiền
```

### Cơ chế chống trùng lặp (Idempotency):
Sử dụng `idempotency_key` (Unique constraint) để đảm bảo một mã giao dịch ngân hàng chỉ được xử lý đúng 1 lần duy nhất.

---

## 3. TÍNH BẤT BIẾN CỦA NHẬT KÝ (IMMUTABLE AUDIT LOGS)

Bảng `admin_audit_logs` được thiết kế để không thể bị can thiệp sau khi đã ghi.

### Code Trigger bảo vệ:
```sql
CREATE OR REPLACE FUNCTION prevent_audit_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable. UPDATE or DELETE operations are strictly forbidden.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_immutable_audit_logs
BEFORE UPDATE OR DELETE ON admin_audit_logs
FOR EACH ROW EXECUTE PROCEDURE prevent_audit_log_tampering();
```

---

## 4. BẢO MẬT API & QUẢN LÝ USER

### Phân cấp quyền truy cập (RBAC):
Hệ thống sử dụng cột `role` trong bảng `users` để phân quyền.
- `user`: Khách hàng thông thường.
- `admin`: Quản trị viên hệ thống (toàn quyền).
- `finance`: Nhân viên kế toán (chỉ quyền nạp/trừ tiền và xem log).

### Bảo mật mã khóa (Secrets):
- **Anon Key**: Dùng ở Frontend, bị giới hạn bởi RLS.
- **Service Role Key**: Chỉ dùng ở Backend (Server components), có quyền vượt qua RLS.
- **Guard Code**:
```typescript
if (typeof window !== 'undefined') {
  throw new Error('CẢNH BÁO BẢO MẬT: Admin client không được phép chạy trên Browser!');
}
```

---

## 5. DỮ LIỆU TRUY VẾT (FORENSIC DATA)

Mọi biến động số dư đều được ghi lại với đầy đủ thông tin:
- **IP Address**: Vị trí mạng thực hiện lệnh.
- **Balance Before/After**: Đối soát số dư tức thời.
- **Source**: Nguồn gốc yêu cầu (Admin Panel, Webhook, Chatbot Sync).

---
*Tài liệu kỹ thuật nội bộ - Ví Điện Tử MVP.*
