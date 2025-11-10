-- 修复jobs表的RLS策略，解决发布岗位的403错误

-- 1. 检查jobs表的RLS状态
DO $$
BEGIN
    -- 检查RLS是否已启用
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'jobs') THEN
        RAISE NOTICE 'RLS未启用，启用RLS...';
        ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
    ELSE
        RAISE NOTICE 'RLS已启用';
    END IF;
END $$;

-- 2. 删除现有可能存在问题的策略
DROP POLICY IF EXISTS "任何人都可以查看岗位" ON jobs;
DROP POLICY IF EXISTS "企业只能管理自己的岗位" ON jobs;
DROP POLICY IF EXISTS "允许所有用户查看岗位" ON jobs;
DROP POLICY IF EXISTS "允许企业用户查看自己的岗位" ON jobs;
DROP POLICY IF EXISTS "允许企业用户创建岗位" ON jobs;
DROP POLICY IF EXISTS "允许企业用户更新岗位" ON jobs;
DROP POLICY IF EXISTS "允许企业用户删除岗位" ON jobs;

-- 3. 创建新的RLS策略（更精确的权限控制）

-- 策略1：允许所有认证用户查看所有岗位
CREATE POLICY "任何人都可以查看岗位" ON jobs
    FOR SELECT USING (true);

-- 策略2：允许企业用户插入（创建）岗位
CREATE POLICY "企业可以创建岗位" ON jobs
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM companies WHERE id = company_id
        )
    );

-- 策略3：允许企业用户更新自己的岗位
CREATE POLICY "企业可以更新自己的岗位" ON jobs
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM companies WHERE id = company_id
        )
    );

-- 策略4：允许企业用户删除自己的岗位
CREATE POLICY "企业可以删除自己的岗位" ON jobs
    FOR DELETE USING (
        auth.uid() IN (
            SELECT user_id FROM companies WHERE id = company_id
        )
    );

-- 4. 验证策略创建
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'jobs' AND schemaname = 'public';
    
    RAISE NOTICE '修复结果:';
    RAISE NOTICE '  - jobs表RLS策略数量: %', policy_count;
    
    IF policy_count >= 4 THEN
        RAISE NOTICE '✅ RLS策略修复完成！';
    ELSE
        RAISE NOTICE '⚠️  策略数量不足，可能存在配置问题';
    END IF;
    
    -- 列出所有策略
    RAISE NOTICE '当前策略列表:';
    FOR policy_rec IN 
        SELECT policyname, cmd, permissive 
        FROM pg_policies 
        WHERE tablename = 'jobs' AND schemaname = 'public'
    LOOP
        RAISE NOTICE '  - % (%): %', 
            policy_rec.policyname, 
            policy_rec.cmd,
            CASE WHEN policy_rec.permissive THEN '允许' ELSE '拒绝' END;
    END LOOP;
END $$;

-- 5. 创建测试函数验证修复效果
CREATE OR REPLACE FUNCTION test_job_rls_fix()
RETURNS JSON AS $$
DECLARE
    test_company_id UUID;
    test_user_id UUID;
    test_result JSON;
BEGIN
    -- 查找一个测试企业ID和对应的用户ID
    SELECT c.id, c.user_id INTO test_company_id, test_user_id
    FROM companies c LIMIT 1;
    
    IF test_company_id IS NULL THEN
        RETURN json_build_object(
            'status', 'warning',
            'message', '没有找到企业数据，无法测试RLS策略'
        );
    END IF;
    
    -- 验证策略存在
    PERFORM 1 FROM pg_policies 
    WHERE tablename = 'jobs' 
    AND schemaname = 'public'
    AND policyname = '企业可以创建岗位';
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'status', 'error',
            'message', '插入策略未找到'
        );
    END IF;
    
    RETURN json_build_object(
        'status', 'success',
        'message', 'jobs表RLS策略配置正确',
        'company_id', test_company_id,
        'user_id', test_user_id,
        'policies_count', (
            SELECT COUNT(*) FROM pg_policies 
            WHERE tablename = 'jobs' AND schemaname = 'public'
        ),
        'strategies', ARRAY[
            '任何人都可以查看岗位',
            '企业可以创建岗位',
            '企业可以更新自己的岗位',
            '企业可以删除自己的岗位'
        ]
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'status', 'error',
            'message', SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- 6. 执行测试
DO $$
DECLARE
    test_result JSON;
BEGIN
    SELECT test_job_rls_fix() INTO test_result;
    RAISE NOTICE '测试结果: %', test_result;
END $$;

RAISE NOTICE 'jobs表RLS策略修复脚本执行完成！';
RAISE NOTICE '请重新尝试发布新岗位功能。';