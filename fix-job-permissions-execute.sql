-- 简化版：直接修复岗位发布权限问题

-- 1. 检查并修复jobs表的插入策略
DO $$
BEGIN
    -- 创建允许认证用户插入岗位的策略
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '允许认证用户创建岗位' AND tablename = 'jobs') THEN
        CREATE POLICY "允许认证用户创建岗位" ON jobs
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        RAISE NOTICE '创建了jobs表插入策略';
    ELSE
        RAISE NOTICE 'jobs表插入策略已存在';
    END IF;
    
    -- 检查策略总数
    SELECT COUNT(*) FROM pg_policies WHERE tablename = 'jobs' AND schemaname = 'public';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '修复jobs表策略时出错: %', SQLERRM;
END $$;

-- 2. 检查user_roles表是否存在
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public') THEN
        RAISE NOTICE 'user_roles表不存在，无法添加用户角色记录';
    ELSE
        RAISE NOTICE 'user_roles表已存在';
    END IF;
END $$;

-- 3. 临时解决方案：创建简单的替代权限检查函数
CREATE OR REPLACE FUNCTION check_company_permission(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    company_exists BOOLEAN;
BEGIN
    -- 检查用户是否关联了企业
    SELECT EXISTS (
        SELECT 1 FROM companies WHERE user_id = user_uuid
    ) INTO company_exists;
    
    RETURN company_exists;
END;
$$ LANGUAGE plpgsql;

-- 4. 测试修复结果
DO $$
DECLARE
    policy_count INTEGER;
    user_roles_exists BOOLEAN;
BEGIN
    -- 检查jobs表策略
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'jobs' AND schemaname = 'public';
    
    -- 检查user_roles表
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_roles' AND table_schema = 'public'
    ) INTO user_roles_exists;
    
    RAISE NOTICE '修复结果:';
    RAISE NOTICE '  - jobs表策略数量: %', policy_count;
    RAISE NOTICE '  - user_roles表存在: %', user_roles_exists;
    RAISE NOTICE '  - 临时权限函数: 已创建';
    
    IF policy_count >= 1 THEN
        RAISE NOTICE '✅ 核心修复完成！';
    ELSE
        RAISE NOTICE '⚠️  核心修复可能有问题';
    END IF;
    
END $$;

RAISE NOTICE '权限修复脚本执行完成！';
RAISE NOTICE '请重新尝试发布新岗位功能。';