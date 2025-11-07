-- 创建消息和通知相关的数据库表

-- 消息表
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  receiver_id UUID NOT NULL REFERENCES auth.users(id),
  conversation_id UUID, -- 可选字段，用于分组消息
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'system')),
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('system', 'job', 'application', 'message', 'security')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  related_id TEXT,
  important BOOLEAN DEFAULT FALSE,
  urgent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  starred BOOLEAN DEFAULT FALSE
);

-- 联系人关系表
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES auth.users(id),
  user2_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_contacts_user1 ON contacts(user1_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user2 ON contacts(user2_id);

-- 启用行级安全策略
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 消息表的行级安全策略
DO $$ 
BEGIN
    -- 允许用户查看自己的消息
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '用户只能查看自己的消息' AND tablename = 'messages') THEN
        CREATE POLICY "用户只能查看自己的消息" ON messages
          FOR SELECT USING (
            auth.uid()::text = sender_id::text OR auth.uid()::text = receiver_id::text
          );
    END IF;
    
    -- 允许任何认证用户插入消息（企业可以给学生发送消息）
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '允许认证用户插入消息' AND tablename = 'messages') THEN
        CREATE POLICY "允许认证用户插入消息" ON messages
          FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
    
    -- 允许用户更新自己的消息
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '用户只能更新自己的消息' AND tablename = 'messages') THEN
        CREATE POLICY "用户只能更新自己的消息" ON messages
          FOR UPDATE USING (
            auth.uid()::text = sender_id::text
          );
    END IF;
END $$;

-- 通知表的行级安全策略
DO $$ 
BEGIN
    -- 允许用户查看自己的通知
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '用户只能查看自己的通知' AND tablename = 'notifications') THEN
        CREATE POLICY "用户只能查看自己的通知" ON notifications
          FOR SELECT USING (
            auth.uid()::text = user_id::text
          );
    END IF;
    
    -- 允许任何认证用户插入通知（企业可以给学生发送通知）
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '允许认证用户插入通知' AND tablename = 'notifications') THEN
        CREATE POLICY "允许认证用户插入通知" ON notifications
          FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
    
    -- 允许用户更新自己的通知
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '用户只能更新自己的通知' AND tablename = 'notifications') THEN
        CREATE POLICY "用户只能更新自己的通知" ON notifications
          FOR UPDATE USING (
            auth.uid()::text = user_id::text
          );
    END IF;
END $$;

-- 联系人表的行级安全策略
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '用户只能查看自己的联系人' AND tablename = 'contacts') THEN
        CREATE POLICY "用户只能查看自己的联系人" ON contacts
          FOR ALL USING (
            auth.uid()::text = user1_id::text OR auth.uid()::text = user2_id::text
          );
    END IF;
END $$;

-- 创建存储桶用于文件上传
INSERT INTO storage.buckets (id, name, public) VALUES
  ('messages', 'messages', true),
  ('images', 'images', true),
  ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- 设置存储桶策略
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '任何人都可以上传文件' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "任何人都可以上传文件" ON storage.objects
          FOR INSERT WITH CHECK (bucket_id = 'messages' OR bucket_id = 'images' OR bucket_id = 'resumes');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '任何人都可以查看文件' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "任何人都可以查看文件" ON storage.objects
          FOR SELECT USING (bucket_id = 'messages' OR bucket_id = 'images' OR bucket_id = 'resumes');
    END IF;
END $$;