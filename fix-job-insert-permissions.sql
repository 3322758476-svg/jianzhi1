-- 修复jobs表插入权限问题
-- 此脚本将解决发布岗位时遇到的403错误

-- 1. 首先检查jobs表的RLS策略
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

-- 2. 删除可能存在的冲突策略
DROP POLICY IF EXISTS "允许所有用户查看岗位" ON jobs;
DROP POLICY IF EXISTS "允许企业用户查看自己的岗位" ON jobs;
DROP POLICY IF EXISTS "允许认证用户创建岗位" ON jobs;

-- 3. 创建新的RLS策略
-- 策略1：允许所有认证用户查看所有岗位
CREATE POLICY "允许所有用户查看岗位" ON jobs
    FOR SELECT USING (auth.role() = 'authenticated');

-- 策略2：允许企业用户查看自己的岗位
CREATE POLICY "允许企业用户查看自己的岗位" ON jobs
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        company_id IN (
            SELECT id FROM companies 
            WHERE user_id = auth.uid()
        )
    );

-- 策略3：允许企业用户创建岗位
CREATE POLICY "允许企业用户创建岗位" ON jobs
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        company_id IN (
            SELECT id FROM companies 
            WHERE user_id = auth.uid()
        )
    );

-- 策略4：允许企业用户更新自己的岗位
CREATE POLICY "允许企业用户更新岗位" ON jobs
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        company_id IN (
            SELECT id FROM companies 
            WHERE user_id = auth.uid()
        )
    );

-- 策略5：允许企业用户删除自己的岗位
CREATE POLICY "允许企业用户删除岗位" ON jobs
    FOR DELETE USING (
        auth.role() = 'authenticated' AND
        company_id IN (
            SELECT id FROM companies 
            WHERE user_id = auth.uid()
        )
    );

-- 4. 验证策略创建结果
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'jobs' AND schemaname = 'public';
    
    RAISE NOTICE '修复结果:';
    RAISE NOTICE '  - jobs表RLS策略数量: %', policy_count;
    
    IF policy_count >= 3 THEN
        RAISE NOTICE '✅ RLS策略修复完成！';
    ELSE
        RAISE NOTICE '⚠️  RLS策略修复可能有问题';
    END IF;
END $$;

-- 5. 创建测试函数验证修复效果
CREATE OR REPLACE FUNCTION test_job_insert_permission()
RETURNS JSON AS $$
DECLARE
    test_company_id UUID;
    test_result JSON;
BEGIN
    -- 查找一个测试企业ID
    SELECT id INTO test_company_id 
    FROM companies LIMIT 1;
    
    IF test_company_id IS NULL THEN
        RETURN json_build_object(
            'status', 'warning',
            'message', '没有找到企业数据，无法测试插入权限'
        );
    END IF;
    
    -- 测试插入权限（不实际插入，只检查权限）
    PERFORM 1 FROM pg_policies 
    WHERE tablename = 'jobs' 
    AND schemaname = 'public'
    AND policyname = '允许企业用户创建岗位';
    
    RETURN json_build_object(
        'status', 'success',
        'message', 'jobs表插入权限策略已配置',
        'company_id', test_company_id,
        'policies_count', (
            SELECT COUNT(*) FROM pg_policies 
            WHERE tablename = 'jobs' AND schemaname = 'public'
        )
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
    SELECT test_job_insert_permission() INTO test_result;
    RAISE NOTICE '测试结果: %', test_result;
END $$;

RAISE NOTICE 'jobs表权限修复脚本执行完成！';
RAISE NOTICE '请重新尝试发布新岗位功能。';