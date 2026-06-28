# TÀI LIỆU HỆ THỐNG VÍ ĐIỆN TỬ (VÍ ĐIỆN TỬ MVP)

## 1. TỔNG QUAN HỆ THỐNG
Hệ thống **Ví Điện Tử MVP** là một nền tảng quản lý tài chính nội bộ, cho phép người dùng nạp tiền, quản lý số dư và mua các gói dịch vụ (Credits). Hệ thống được thiết kế để tích hợp chặt chẽ với các ứng dụng vệ tinh (như Chatbot) thông qua cơ chế đồng bộ tài khoản tự động.

### Công nghệ sử dụng:
- **Frontend**: Next.js 15+ (App Router), React 19, Tailwind CSS.
- **Backend/Database**: Supabase (PostgreSQL).
- **Security**: Row Level Security (RLS), Postgres RPC, Hardened Audit Logs.
- **Icons**: Lucide React.

---

## 2. KIẾN TRÚC DỮ LIỆU (DATABASE SCHEMA)

Hệ thống sử dụng PostgreSQL với các bảng được chuẩn hóa và bảo mật bằng RLS.

### 2.1. Các bảng chính
| Tên bảng | Mô tả | Các trường quan trọng |
| :--- | :--- | :--- |
| `users` | Thông tin người dùng hệ thống | `id`, `email`, `role` (user/admin), `created_at` |
| `wallets` | Ví tiền mặt (VNĐ) của người dùng | `user_id`, `cash_balance` |
| `credit_products` | Danh mục sản phẩm (ví dụ: AI_CREDIT) | `code`, `name`, `price_per_unit` |
| `user_credits` | Số dư tín chỉ của từng người dùng | `user_id`, `product_code`, `balance` |
| `transactions` | Lịch sử giao dịch | `user_id`, `type` (TOPUP/BUY/USE), `amount`, `balance_after`, `status` |
| `deposit_requests` | Yêu cầu nạp tiền (chờ xác nhận) | `code`, `amount`, `status`, `expired_at` |
| `audit_logs` | Nhật ký hệ thống bảo mật cao | `action`, `table_name`, `old_data`, `new_data`, `ip_address` |

### 2.2. Cơ chế xử lý nghiệp vụ (Postgres RPC & Triggers)
- **`handle_new_user()`**: Trigger tự động tạo Ví và khởi tạo Credit khi có người dùng mới đăng ký qua Supabase Auth.
- **`process_deposit()`**: RPC xử lý nạp tiền nguyên tử (Atomic), đảm bảo không xảy ra lỗi trùng lặp giao dịch (Idempotency).
- **`buy_credit()`**: RPC trừ tiền mặt và cộng Credit trong cùng một transaction để đảm bảo tính toàn vẹn dữ liệu.
- **`consume_credit()`**: RPC trừ Credit khi người dùng sử dụng dịch vụ (ví dụ: hỏi Chatbot).

---

## 3. HỆ THỐNG GIAO DIỆN (UI SYSTEM)

### 3.1. Phong cách thiết kế
- **Aesthetic**: Hiện đại, tối giản với bảng màu Slate, Blue và Indigo.
- **Components**: Sử dụng Card thiết kế bo góc lớn (3xl), hiệu ứng Hover chuyển màu Gradient nhẹ.
- **Responsive**: Tương thích hoàn toàn với Mobile và Desktop.

### 3.2. Các trang chính & Chức năng

#### A. Trang Dashboard (Dành cho Người dùng)
- **Tổng quan tài khoản**: Hiển thị số dư VNĐ và AI Credits dưới dạng thẻ (Card) trực quan.
- **Nạp tiền**: Cung cấp giao diện tạo yêu cầu nạp tiền qua chuyển khoản ngân hàng.
- **Mua Credit**: Cho phép chuyển đổi tiền mặt sang AI Credits.

#### B. Trang Admin Panel (Dành cho Quản trị viên)
- **Thống kê tổng lực**:
  - Tổng số người dùng (phân loại theo nguồn: Trực tiếp hoặc Đồng bộ từ Chatbot).
  - Tổng số tiền đang lưu thông trong toàn hệ thống.
- **Quản lý Khách hàng**: Danh sách chi tiết User kèm số dư ví và credit theo thời gian thực.
- **Lịch sử giao dịch**: Theo dõi 10 giao dịch gần nhất với trạng thái chi tiết (Thành công/Thất bại).

---

## 4. CHI TIẾT CÁC TAB & CHỨC NĂNG TRÊN UI

### 4.1. Thanh điều hướng (Sidebar/Tabs)
- **Trang chủ (Overview)**: Xem nhanh số dư và thông báo mới.
- **Nạp tiền (Deposit)**: Lịch sử nạp và form tạo lệnh nạp.
- **Giao dịch (Transactions)**: Chi tiết mọi biến động số dư.
- **Quản trị (Admin)**: (Chỉ dành cho Admin) Xem báo cáo và quản lý User.

### 4.2. Chức năng chi tiết
1. **Đăng nhập/Đăng ký**: Hỗ trợ xác thực qua Email/Password, tích hợp sẵn với Supabase Auth.
2. **Nạp tiền thông minh**: Sinh mã giao dịch duy nhất để đối soát tự động.
3. **Mua Credit**: Tính toán giá tiền dựa trên đơn giá trong database, cập nhật số dư tức thì.
4. **Log bảo mật**: Mọi thay đổi số dư đều được ghi vào bảng `transactions` và `audit_logs` để truy vết khi cần.

---

## 5. HƯỚNG DẪN SỬ DỤNG

### Cho Người dùng:
1. Đăng ký tài khoản.
2. Vào Dashboard -> Nhấn "Nạp thêm" để lấy thông tin chuyển khoản.
3. Sau khi tiền vào ví, nhấn "Mua thêm Credit" để nạp tín chỉ sử dụng Chatbot.

### Cho Quản trị viên:
1. Truy cập vào đường dẫn `/admin`.
2. Theo dõi biểu đồ tổng quan để biết tình hình tài chính.
3. Kiểm tra danh sách User để hỗ trợ khi có thắc mắc về số dư.

---
*Tài liệu được tạo tự động bởi Antigravity AI Assistant.*
