-- ==========================================
-- SEED DATA - Dữ liệu kinh doanh gốc
-- ==========================================

-- 1. Các gói Credit mặc định của hệ thống
INSERT INTO credit_products (code, name, price_per_unit) 
VALUES 
    ('AI_CREDIT', 'AI Generation Credit', 1000),
    ('SMS_CREDIT', 'SMS Marketing Credit', 500)
ON CONFLICT (code) DO UPDATE 
SET 
    name = EXCLUDED.name,
    price_per_unit = EXCLUDED.price_per_unit;

-- Thêm các dữ liệu mẫu khác ở đây (ví dụ: mock users, mock branches...)
