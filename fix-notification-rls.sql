-- 修复通知和消息表的RLS策略
-- 允许企业端能够给学生发送通知和消息

-- 1. 删除现有的通知表策略
DROP POLICY IF EXISTS "用户只能查看自己的通知" ON notifications;

-- 2. 重新创建通知表策略
-- 允许用户查看自己的通知
CREATE POLICY "用户只能查看自己的通知" ON notifications
  FOR SELECT USING (
    auth.uid()::text = user_id::text
  );

-- 允许任何认证用户插入通知（企业可以给学生发送通知）
CREATE POLICY "允许认证用户插入通知" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 允许用户更新自己的通知
CREATE POLICY "用户只能更新自己的通知" ON notifications
  FOR UPDATE USING (
    auth.uid()::text = user_id::text
  );

-- 3. 删除现有的消息表策略
DROP POLICY IF EXISTS "用户只能查看自己的消息" ON messages;

-- 4. 重新创建消息表策略
-- 允许用户查看自己的消息
CREATE POLICY "用户只能查看自己的消息" ON messages
  FOR SELECT USING (
    auth.uid()::text = sender_id::text OR auth.uid()::text = receiver_id::text
  );

-- 允许任何认证用户插入消息（企业可以给学生发送消息）
CREATE POLICY "允许认证用户插入消息" ON messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 允许用户更新自己的消息
CREATE POLICY "用户只能更新自己的消息" ON messages
  FOR UPDATE USING (
    auth.uid()::text = sender_id::text
  );

-- 5. 验证策略是否已正确创建
SELECT schemaname, tablename, policyname, permissive, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('notifications', 'messages')
ORDER BY tablename, policyname;