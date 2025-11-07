-- 005_complete_database.sql
-- 完整的数据库架构和连接测试
-- 此文件包含数据库最终优化、连接测试和系统集成

-- 1. 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 为所有表添加更新时间触发器
CREATE TRIGGER update_students_updated_at 
    BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at 
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. 创建系统健康检查视图
CREATE OR REPLACE VIEW system_health AS
SELECT 
    'database_tables' as check_type,
    COUNT(*) as check_value,
    CASE 
        WHEN COUNT(*) >= 7 THEN 'healthy'
        ELSE 'warning'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
    'row_level_security' as check_type,
    COUNT(*) as check_value,
    CASE 
        WHEN COUNT(*) >= 6 THEN 'healthy'
        ELSE 'warning'
    END as status
FROM pg_policies 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'total_users' as check_type,
    COUNT(*) as check_value,
    CASE 
        WHEN COUNT(*) > 0 THEN 'healthy'
        ELSE 'warning'
    END as status
FROM auth.users
UNION ALL
SELECT 
    'active_jobs' as check_type,
    COUNT(*) as check_value,
    CASE 
        WHEN COUNT(*) > 0 THEN 'healthy'
        ELSE 'info'
    END as status
FROM jobs 
WHERE status = 'active';

-- 4. 创建连接测试函数
CREATE OR REPLACE FUNCTION test_database_connection()
RETURNS JSON AS $$
DECLARE
    result JSON;
    test_timestamp TIMESTAMP := NOW();
BEGIN
    -- 测试基本连接
    PERFORM 1;
    
    -- 测试表访问
    PERFORM COUNT(*) FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    -- 测试认证系统
    PERFORM COUNT(*) FROM auth.users LIMIT 1;
    
    -- 返回测试结果
    result := json_build_object(
        'status', 'success',
        'message', '数据库连接正常',
        'timestamp', test_timestamp,
        'tables_count', (
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        ),
        'users_count', (
            SELECT COUNT(*) FROM auth.users
        ),
        'active_jobs_count', (
            SELECT COUNT(*) FROM jobs WHERE status = 'active'
        )
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'status', 'error',
            'message', SQLERRM,
            'timestamp', test_timestamp
        );
END;
$$ LANGUAGE plpgsql;

-- 5. 创建企业账号验证函数
CREATE OR REPLACE FUNCTION verify_company_account(company_email TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
    company_record RECORD;
    user_record RECORD;
BEGIN
    -- 查找用户
    SELECT * INTO user_record 
    FROM auth.users 
    WHERE email = company_email 
    LIMIT 1;
    
    IF user_record IS NULL THEN
        RETURN json_build_object(
            'status', 'error',
            'message', '用户不存在',
            'exists', false
        );
    END IF;
    
    -- 查找企业信息
    SELECT * INTO company_record 
    FROM companies 
    WHERE user_id = user_record.id 
    LIMIT 1;
    
    IF company_record IS NULL THEN
        RETURN json_build_object(
            'status', 'warning',
            'message', '用户存在但企业信息未完善',
            'exists', true,
            'user_id', user_record.id,
            'role', COALESCE(user_record.raw_user_meta_data->>'role', 'student'),
            'company_complete', false
        );
    END IF;
    
    -- 返回完整的企业信息
    RETURN json_build_object(
        'status', 'success',
        'message', '企业账号验证成功',
        'exists', true,
        'user_id', user_record.id,
        'company_id', company_record.id,
        'company_name', company_record.company_name,
        'role', COALESCE(user_record.raw_user_meta_data->>'role', 'company'),
        'verified', company_record.verified,
        'company_complete', true
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'status', 'error',
            'message', SQLERRM,
            'exists', false
        );
END;
$$ LANGUAGE plpgsql;

-- 6. 创建测试数据插入函数（仅用于开发环境）
CREATE OR REPLACE FUNCTION insert_test_company_account()
RETURNS JSON AS $$
DECLARE
    test_user_id UUID;
    test_company_id UUID;
    result JSON;
BEGIN
    -- 检查是否已存在测试账号
    SELECT id INTO test_user_id 
    FROM auth.users 
    WHERE email = 'company@test.com';
    
    IF test_user_id IS NOT NULL THEN
        RETURN json_build_object(
            'status', 'info',
            'message', '测试企业账号已存在',
            'user_id', test_user_id
        );
    END IF;
    
    -- 创建测试用户（这里只是示例，实际创建需要通过Supabase Auth）
    -- 在实际应用中，测试数据应该通过应用层插入
    
    RETURN json_build_object(
        'status', 'info',
        'message', '测试数据插入功能需要在应用层实现'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'status', 'error',
            'message', SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- 7. 创建数据库连接监控视图
CREATE OR REPLACE VIEW database_connection_status AS
SELECT 
    'connection_test' as test_type,
    (test_database_connection() ->> 'status') as status,
    (test_database_connection() ->> 'message') as message,
    NOW() as last_checked
UNION ALL
SELECT 
    'tables_accessible' as test_type,
    CASE 
        WHEN COUNT(*) > 0 THEN 'success' 
        ELSE 'error' 
    END as status,
    '核心业务表可访问' as message,
    NOW() as last_checked
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('students', 'companies', 'jobs', 'applications')
UNION ALL
SELECT 
    'rlspolicies_active' as test_type,
    CASE 
        WHEN COUNT(*) >= 6 THEN 'success' 
        ELSE 'warning' 
    END as status,
    '行级安全策略已启用' as message,
    NOW() as last_checked
FROM pg_policies 
WHERE schemaname = 'public';

-- 8. 创建企业账号登录验证视图
CREATE OR REPLACE VIEW company_login_help AS
SELECT 
    'account_status' as help_type,
    '企业账号登录前请确保：' as title,
    ARRAY[
        '1. 已注册企业账号（邮箱格式）',
        '2. 企业信息已完善',
        '3. 邮箱已验证（如需要）',
        '4. 使用正确的密码'
    ] as steps,
    '如遇问题，请检查控制台错误信息' as troubleshooting
UNION ALL
SELECT 
    'common_issues' as help_type,
    '常见问题解决方案：' as title,
    ARRAY[
        '账号不存在 → 请先注册企业账号',
        '密码错误 → 重置密码或检查输入',
        '权限不足 → 确认账号角色为企业',
        '连接失败 → 检查网络和Supabase配置'
    ] as steps,
    '详细错误信息请查看浏览器控制台' as troubleshooting;

-- 9. 创建系统配置表
CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    config_type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入默认配置
INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('company_registration_enabled', 'true', 'boolean', '是否允许企业注册'),
('student_registration_enabled', 'true', 'boolean', '是否允许学生注册'),
('max_job_postings_per_company', '10', 'integer', '每家企业最大岗位发布数量'),
('job_application_deadline_days', '30', 'integer', '岗位申请默认截止天数'),
('system_maintenance_mode', 'false', 'boolean', '系统维护模式');

-- 10. 创建审计日志触发器
CREATE OR REPLACE FUNCTION log_company_login_attempt()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id, 
        action_type, 
        table_name, 
        record_id, 
        old_values, 
        new_values
    ) VALUES (
        NEW.id,
        'login_attempt',
        'auth.users',
        NEW.id,
        NULL,
        json_build_object('last_login_attempt', NOW())
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 注意：实际应用中，登录尝试的审计应该在应用层实现

-- 11. 创建数据库连接测试报告
CREATE OR REPLACE VIEW database_test_report AS
SELECT 
    dcs.test_type,
    dcs.status,
    dcs.message,
    sh.check_value,
    sh.status as health_status
FROM database_connection_status dcs
LEFT JOIN system_health sh ON dcs.test_type = sh.check_type
WHERE sh.check_type IS NOT NULL;

-- 12. 授予必要的权限（如果使用自定义角色）
-- 注意：在Supabase中，权限通常通过仪表板管理

-- 完成消息
COMMENT ON DATABASE CURRENT_DATABASE IS '大学生兼职平台数据库 - 迁移005完成';

-- 测试数据库连接
-- SELECT test_database_connection();
-- SELECT * FROM system_health;
-- SELECT * FROM database_connection_status;