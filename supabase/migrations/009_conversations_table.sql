-- 创建对话表以支持实时通讯功能

-- 对话表
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id),
  company_id UUID NOT NULL REFERENCES auth.users(id),
  job_id UUID REFERENCES jobs(id),
  last_message_id UUID REFERENCES messages(id),
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 确保每个学生和企业的组合只有一个对话
  UNIQUE(student_id, company_id, job_id)
);

-- 为消息表添加对话ID外键约束
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id),
ADD COLUMN IF NOT EXISTS sender_type TEXT NOT NULL DEFAULT 'student' CHECK (sender_type IN ('student', 'company')),
ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_conversations_student_company ON conversations(student_id, company_id);
CREATE INDEX IF NOT EXISTS idx_conversations_company_student ON conversations(company_id, student_id);
CREATE INDEX IF NOT EXISTS idx_conversations_job_id ON conversations(job_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- 启用行级安全策略
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- 对话表的行级安全策略
DO $$ 
BEGIN
    -- 允许学生查看自己的对话
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '学生只能查看自己的对话' AND tablename = 'conversations') THEN
        CREATE POLICY "学生只能查看自己的对话" ON conversations
          FOR SELECT USING (
            auth.uid()::text = student_id::text
          );
    END IF;
    
    -- 允许企业查看自己的对话
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '企业只能查看自己的对话' AND tablename = 'conversations') THEN
        CREATE POLICY "企业只能查看自己的对话" ON conversations
          FOR SELECT USING (
            auth.uid()::text = company_id::text
          );
    END IF;
    
    -- 允许学生和企业创建对话
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '允许认证用户创建对话' AND tablename = 'conversations') THEN
        CREATE POLICY "允许认证用户创建对话" ON conversations
          FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
    
    -- 允许学生和企业更新自己的对话
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '用户只能更新自己的对话' AND tablename = 'conversations') THEN
        CREATE POLICY "用户只能更新自己的对话" ON conversations
          FOR UPDATE USING (
            auth.uid()::text = student_id::text OR auth.uid()::text = company_id::text
          );
    END IF;
END $$;

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为对话表添加更新时间触发器
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建更新对话最后消息的触发器函数
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新对话的最后消息和时间
    UPDATE conversations 
    SET last_message_id = NEW.id, 
        updated_at = NEW.created_at,
        unread_count = unread_count + CASE WHEN NEW.is_read = false THEN 1 ELSE 0 END
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为消息表添加触发器
CREATE TRIGGER update_conversation_on_message 
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();