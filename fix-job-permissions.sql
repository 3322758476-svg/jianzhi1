-- 修复岗位发布权限问题的SQL脚本

-- 1. 检查并修复jobs表的行级安全策略
DO $$
BEGIN
    -- 检查是否允许认证用户插入数据
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '允许认证用户创建岗位' AND tablename = 'jobs') THEN
        CREATE POLICY "允许认证用户创建岗位" ON jobs
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
    
    -- 确保企业可以更新自己的岗位
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '企业可以更新自己的岗位' AND tablename = 'jobs') THEN
        CREATE POLICY "企业可以更新自己的岗位" ON jobs
            FOR UPDATE USING (
                auth.uid()::text IN (SELECT user_id::text FROM companies WHERE id::text = company_id::text)
            );
    END IF;
    
    -- 确保企业可以删除自己的岗位
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '企业可以删除自己的岗位' AND tablename = 'jobs') THEN
        CREATE POLICY "企业可以删除自己的岗位" ON jobs
            FOR DELETE USING (
                auth.uid()::text IN (SELECT user_id::text FROM companies WHERE id::text = company_id::text)
            );
    END IF;
    
    RAISE NOTICE 'jobs表策略已修复';
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '修复jobs表策略时出错: %', SQLERRM;
END $$;

-- 2. 检查user_roles表是否存在并修复
DO $$
BEGIN
    -- 检查user_roles表是否存在
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        -- 创建user_roles表
        CREATE TABLE user_roles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'company_admin', 'hr_manager', 'hr_assistant', 'interviewer', 'student')),
            permissions TEXT[],
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
        );
        
        -- 创建索引
        CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
        CREATE INDEX idx_user_roles_role ON user_roles(role);
        
        -- 启用行级安全策略
        ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
        
        -- 创建行级安全策略
        CREATE POLICY "用户只能查看自己的角色" ON user_roles
            FOR SELECT USING (auth.uid()::text = user_id::text);
            
        RAISE NOTICE '创建了user_roles表';
    ELSE
        RAISE NOTICE 'user_roles表已存在';
    END IF;
    
    -- 检查是否已有合适的策略
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '用户只能查看自己的角色' AND tablename = 'user_roles') THEN
        CREATE POLICY "用户只能查看自己的角色" ON user_roles
            FOR SELECT USING (auth.uid()::text = user_id::text);
        RAISE NOTICE '创建了user_roles表策略';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '处理user_roles表时出错: %', SQLERRM;
END $$;

-- 3. 为现有企业用户创建默认角色
DO $$
DECLARE
    company_user RECORD;
    user_role_count INTEGER;
BEGIN
    -- 查找所有企业用户
    FOR company_user IN 
        SELECT DISTINCT c.user_id 
        FROM companies c 
        JOIN auth.users u ON c.user_id = u.id
    LOOP
        -- 检查是否已有角色记录
        SELECT COUNT(*) INTO user_role_count 
        FROM user_roles 
        WHERE user_id = company_user.user_id;
        
        -- 如果没有角色记录，插入默认角色
        IF user_role_count = 0 THEN
            INSERT INTO user_roles (user_id, role, permissions) VALUES (
                company_user.user_id,
                'company_admin',
                ARRAY['job:view', 'job:create', 'job:edit', 'job:delete', 'job:publish', 
                      'application:view', 'application:review', 'application:approve', 'application:reject', 'application:export',
                      'analytics:view', 'analytics:export', 'settings:view', 'settings:edit', 'member:manage']
            );
            
            RAISE NOTICE '为用户 % 创建了公司管理员角色', company_user.user_id;
        END IF;
    END LOOP;
    
    -- 检查是否有用户
    IF NOT FOUND THEN
        RAISE NOTICE '没有找到企业用户，请先创建企业账号';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '创建用户角色时出错: %', SQLERRM;
END $$;

-- 4. 创建测试数据插入函数（可选）
CREATE OR REPLACE FUNCTION insert_test_company_user()
RETURNS JSON AS $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- 用实际用户ID替换
BEGIN
    -- 检查用户是否存在
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = test_user_id) THEN
        RETURN json_build_object(
            'status', 'error',
            'message', '测试用户不存在，请使用真实的用户ID'
        );
    END IF;
    
    -- 插入测试角色
    INSERT INTO user_roles (user_id, role, permissions) VALUES (
        test_user_id,
        'company_admin',
        ARRAY['job:view', 'job:create', 'job:edit', 'job:delete', 'job:publish']
    ) ON CONFLICT (user_id) DO UPDATE SET 
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions;
    
    RETURN json_build_object(
        'status', 'success',
        'message', '测试用户角色已创建/更新'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'status', 'error',
            'message', SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- 5. 验证修复结果
DO $$
DECLARE
    jobs_policy_count INTEGER;
    user_roles_table_exists BOOLEAN;
    company_role_count INTEGER;
BEGIN
    -- 检查jobs表的策略数量
    SELECT COUNT(*) INTO jobs_policy_count 
    FROM pg_policies 
    WHERE tablename = 'jobs' AND schemaname = 'public';
    
    -- 检查user_roles表是否存在
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_roles' AND table_schema = 'public'
    ) INTO user_roles_table_exists;
    
    -- 检查企业用户角色数量
    SELECT COUNT(*) INTO company_role_count
    FROM user_roles ur
    JOIN companies c ON ur.user_id = c.user_id;
    
    RAISE NOTICE '修复结果报告:';
    RAISE NOTICE '  - jobs表策略数量: %', jobs_policy_count;
    RAISE NOTICE '  - user_roles表存在: %', user_roles_table_exists;
    RAISE NOTICE '  - 企业用户角色数量: %', company_role_count;
    
    IF jobs_policy_count >= 3 AND user_roles_table_exists AND company_role_count > 0 THEN
        RAISE NOTICE '✅ 所有修复任务完成！';
    ELSE
        RAISE NOTICE '⚠️  部分修复可能未完成，请检查具体问题';
    END IF;
    
END $$;

-- 6. 创建视图用于监控权限状态
CREATE OR REPLACE VIEW permission_status AS
SELECT 
    'jobs_policies' as check_type,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) >= 3 THEN 'healthy'
        ELSE 'warning'
    END as status
FROM pg_policies 
WHERE tablename = 'jobs' AND schemaname = 'public'
UNION ALL
SELECT 
    'user_roles_table' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN 1
        ELSE 0
    END as table_exists,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN 'healthy'
        ELSE 'error'
    END as status
UNION ALL
SELECT 
    'company_roles' as check_type,
    COUNT(*) as role_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'healthy'
        ELSE 'info'
    END as status
FROM user_roles ur
JOIN companies c ON ur.user_id = c.user_id;

-- 完成消息
COMMENT ON FUNCTION insert_test_company_user() IS '插入测试企业用户角色函数';
COMMENT ON VIEW permission_status IS '权限状态监控视图';

-- 测试查询
-- SELECT * FROM permission_status;
-- SELECT insert_test_company_user();