-- Thêm quyền INSERT cho bảng deposit_requests để User có thể tự tạo yêu cầu nạp tiền
CREATE POLICY "Users can insert own deposits" 
ON public.deposit_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
