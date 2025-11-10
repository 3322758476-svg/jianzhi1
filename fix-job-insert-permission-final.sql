-- 修复jobs表插入权限问题
-- 解决 "new row violates row-level security policy for table 'jobs'" 错误

-- 1. 查看当前jobs表的策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'jobs';

-- 2. 删除有问题的策略
DROP POLICY IF EXISTS "企业只能管理自己的岗位" ON jobs;

-- 3. 创建专门的插入策略（允许企业用户创建岗位）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '企业可以创建岗位' AND tablename = 'jobs') THEN
        CREATE POLICY "企业可以创建岗位" ON jobs
            FOR INSERT 
            WITH CHECK (
                -- 允许企业用户创建岗位，新记录的company_id对应的company的user_id必须是当前用户
                auth.uid()::text IN (SELECT user_id::text FROM companies WHERE id::text = company_id::text)
            );
    END IF;
END $$;

-- 4. 创建专门的查询策略
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '任何人都可以查看岗位' AND tablename = 'jobs') THEN
        CREATE POLICY "任何人都可以查看岗位" ON jobs
            FOR SELECT USING (true);
    END IF;
END $$;

-- 5. 创建专门的更新策略
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '企业可以更新自己的岗位' AND tablename = 'jobs') THEN
        CREATE POLICY "企业可以更新自己的岗位" ON jobs
            FOR UPDATE 
            USING (
                auth.uid()::text IN (SELECT user_id::text FROM companies WHERE id::text = company_id::text)
            )
            WITH CHECK (
                auth.uid()::text IN (SELECT user_id::text FROM companies WHERE id::text = company_id::text)
            );
    END IF;
END $$;

-- 6. 创建专门的删除策略
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '企业可以删除自己的岗位' AND tablename = 'jobs') THEN
        CREATE POLICY "企业可以删除自己的岗位" ON jobs
            FOR DELETE 
            USING (
                auth.uid()::text IN (SELECT user_id::text FROM companies WHERE id::text = company_id::text)
            );
    END IF;
END $$;

-- 7. 验证修复结果
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'jobs'
ORDER BY policyname;

-- 8. 测试修复是否有效
-- 这个测试需要在应用环境中进行，因为需要真实的用户认证
-- 步骤：
-- 1. 企业用户登录
-- 2. 尝试创建新岗位
-- 3. 检查是否成功