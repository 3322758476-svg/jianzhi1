-- 增强数据库架构 - 性能优化和功能扩展
-- 注意：此文件依赖于003_core_tables.sql中的表结构

-- 1. 创建视图和物化视图

-- 岗位统计视图
CREATE OR REPLACE VIEW job_statistics AS
SELECT 
    j.id,
    j.title,
    j.company_id,
    c.company_name,
    j.views_count,
    j.applications_count,
    j.created_at,
    COUNT(DISTINCT a.id) as total_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'accepted' THEN a.id END) as accepted_applications,
    AVG(r.rating) as avg_rating
FROM jobs j
LEFT JOIN companies c ON j.company_id = c.id
LEFT JOIN applications a ON j.id = a.job_id
LEFT JOIN reviews r ON j.id = r.job_id
WHERE j.status = 'active'
GROUP BY j.id, c.company_name;

-- 学生统计视图
CREATE OR REPLACE VIEW student_statistics AS
SELECT 
    s.id,
    s.user_id,
    s.real_name,
    s.school,
    s.major,
    COUNT(DISTINCT a.id) as total_applications,
    COUNT(DISTINCT CASE WHEN a.status = 'accepted' THEN a.id END) as accepted_applications,
    AVG(r.rating) as avg_rating
FROM students s
LEFT JOIN applications a ON s.id = a.student_id
LEFT JOIN reviews r ON s.user_id = r.reviewed_id AND r.review_type = 'company_to_student'
GROUP BY s.id;

-- 2. 创建性能优化索引

-- 复合索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_jobs_composite ON jobs(status, category, created_at);
CREATE INDEX IF NOT EXISTS idx_applications_composite ON applications(job_id, status, applied_at);
CREATE INDEX IF NOT EXISTS idx_messages_composite ON messages(sender_id, receiver_id, created_at);

-- 全文搜索索引
CREATE INDEX IF NOT EXISTS idx_jobs_title_search ON jobs USING gin(to_tsvector('simple', title));
CREATE INDEX IF NOT EXISTS idx_jobs_description_search ON jobs USING gin(to_tsvector('simple', description));
CREATE INDEX IF NOT EXISTS idx_companies_search ON companies USING gin(to_tsvector('simple', company_name || ' ' || description));

-- 3. 创建自定义函数

-- 搜索岗位函数
CREATE OR REPLACE FUNCTION search_jobs(
    search_query TEXT DEFAULT NULL,
    categories TEXT[] DEFAULT NULL,
    job_types TEXT[] DEFAULT NULL,
    locations TEXT[] DEFAULT NULL,
    salary_min INTEGER DEFAULT NULL,
    salary_max INTEGER DEFAULT NULL,
    page_num INTEGER DEFAULT 1,
    page_size INTEGER DEFAULT 20
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    company_name TEXT,
    description TEXT,
    salary_range TEXT,
    work_location TEXT,
    job_type TEXT,
    category TEXT,
    created_at TIMESTAMPTZ,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH filtered_jobs AS (
        SELECT 
            j.*,
            c.company_name,
            COUNT(*) OVER() as total_count
        FROM jobs j
        JOIN companies c ON j.company_id = c.id
        WHERE j.status = 'active'
        AND (search_query IS NULL OR 
             to_tsvector('simple', j.title || ' ' || j.description) @@ to_tsquery('simple', search_query))
        AND (categories IS NULL OR j.category = ANY(categories))
        AND (job_types IS NULL OR j.job_type = ANY(job_types))
        AND (locations IS NULL OR j.work_location ILIKE ANY(locations))
        AND (salary_min IS NULL OR (j.salary_range ~ '\d+' AND 
             CAST(SUBSTRING(j.salary_range FROM '\d+') AS INTEGER) >= salary_min))
        AND (salary_max IS NULL OR (j.salary_range ~ '\d+' AND 
             CAST(SUBSTRING(j.salary_range FROM '\d+') AS INTEGER) <= salary_max))
        ORDER BY j.created_at DESC
        LIMIT page_size
        OFFSET (page_num - 1) * page_size
    )
    SELECT 
        fj.id,
        fj.title,
        fj.company_name,
        fj.description,
        fj.salary_range,
        fj.work_location,
        fj.job_type,
        fj.category,
        fj.created_at,
        fj.total_count
    FROM filtered_jobs fj;
END;
$$ LANGUAGE plpgsql;

-- 增加浏览量函数
CREATE OR REPLACE FUNCTION increment_job_views(job_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE jobs 
    SET views_count = views_count + 1 
    WHERE id = job_id;
END;
$$ LANGUAGE plpgsql;

-- 增加申请数函数
CREATE OR REPLACE FUNCTION increment_job_applications(job_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE jobs 
    SET applications_count = applications_count + 1 
    WHERE id = job_id;
END;
$$ LANGUAGE plpgsql;

-- 4. 创建触发器

-- 自动更新申请状态为过期
CREATE OR REPLACE FUNCTION update_expired_applications()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE applications 
    SET status = 'expired' 
    WHERE job_id IN (
        SELECT id FROM jobs 
        WHERE application_deadline < NOW() AND status = 'active'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_expired_applications
    AFTER INSERT OR UPDATE ON jobs
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_expired_applications();

-- 5. 创建数据验证约束

-- 邮箱格式验证
CREATE OR REPLACE FUNCTION validate_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- 手机号格式验证
CREATE OR REPLACE FUNCTION validate_phone(phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN phone ~ '^1[3-9]\d{9}$';
END;
$$ LANGUAGE plpgsql;

-- 6. 创建审计表

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 审计日志索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- 7. 创建数据备份视图

-- 重要数据备份视图
CREATE OR REPLACE VIEW data_backup_summary AS
SELECT 
    'jobs' as table_name,
    COUNT(*) as record_count,
    MAX(created_at) as last_updated
FROM jobs
UNION ALL
SELECT 
    'applications' as table_name,
    COUNT(*) as record_count,
    MAX(created_at) as last_updated
FROM applications
UNION ALL
SELECT 
    'users' as table_name,
    COUNT(*) as record_count,
    MAX(created_at) as last_updated
FROM auth.users;

-- 8. 性能监控视图

CREATE OR REPLACE VIEW performance_metrics AS
SELECT 
    'daily_active_jobs' as metric_name,
    COUNT(*) as metric_value
FROM jobs 
WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' AND status = 'active'
UNION ALL
SELECT 
    'weekly_applications' as metric_name,
    COUNT(*) as metric_value
FROM applications 
WHERE applied_at >= CURRENT_DATE - INTERVAL '7 days'
UNION ALL
SELECT 
    'monthly_new_users' as metric_name,
    COUNT(*) as metric_value
FROM auth.users 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';