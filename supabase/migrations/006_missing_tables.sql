-- 006_missing_tables.sql
-- 修复缺失的表结构 - profiles 和 user_roles 表

-- 0. 首先创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. 创建 profiles 表（用户档案表）
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'company', 'admin')),
    avatar_url TEXT,
    bio TEXT,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. 创建 user_roles 表（用户角色表）
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'company_admin', 'hr_manager', 'hr_assistant', 'interviewer', 'student')),
    permissions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- 4. 启用行级安全策略
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 5. 创建行级安全策略
-- profiles 表策略
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '用户只能查看和修改自己的档案' AND tablename = 'profiles') THEN
        CREATE POLICY "用户只能查看和修改自己的档案" ON profiles
            FOR ALL USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- user_roles 表策略
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '用户只能查看自己的角色' AND tablename = 'user_roles') THEN
        CREATE POLICY "用户只能查看自己的角色" ON user_roles
            FOR SELECT USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- 6. 创建更新时间触发器
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at 
    BEFORE UPDATE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. 插入默认角色数据（可选，用于测试）
-- INSERT INTO user_roles (user_id, role, permissions) VALUES
-- ('test-user-id', 'company_admin', ARRAY['job:view', 'job:create', 'job:edit', 'job:delete', 'application:view', 'application:review']);

-- 8. 创建视图用于权限检查
CREATE OR REPLACE VIEW user_permissions AS
SELECT 
    p.user_id,
    p.role as user_type,
    ur.role as permission_role,
    ur.permissions,
    c.id as company_id,
    c.company_name
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
LEFT JOIN companies c ON p.company_id = c.id;

-- 9. 创建测试数据插入函数
CREATE OR REPLACE FUNCTION create_test_company_profile()
RETURNS JSON AS $$
DECLARE
    test_user_id UUID;
    test_company_id UUID;
    test_profile_id UUID;
    test_role_id UUID;
BEGIN
    -- 检查是否已存在测试用户（这里需要实际存在的用户ID）
    -- 在实际应用中，应该通过应用层创建测试数据
    
    RETURN json_build_object(
        'status', 'info',
        'message', '测试数据创建需要在应用层实现，请先创建真实用户'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'status', 'error',
            'message', SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- 10. 完成消息
COMMENT ON TABLE profiles IS '用户档案表 - 存储用户基本信息和公司关联';
COMMENT ON TABLE user_roles IS '用户角色表 - 存储用户权限和角色信息';

-- 测试查询
-- SELECT * FROM profiles LIMIT 1;
-- SELECT * FROM user_roles LIMIT 1;