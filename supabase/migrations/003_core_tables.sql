-- 创建核心业务数据表

-- 学生信息表
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id VARCHAR(50) UNIQUE,
    real_name VARCHAR(100),
    school VARCHAR(200),
    major VARCHAR(100),
    grade VARCHAR(50),
    phone VARCHAR(20),
    skills TEXT[],
    experience TEXT,
    expected_salary VARCHAR(100),
    preferred_locations TEXT[],
    preferred_job_types TEXT[],
    resume_url TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 企业信息表
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name VARCHAR(200) NOT NULL,
    business_license VARCHAR(100) UNIQUE,
    industry VARCHAR(100),
    scale VARCHAR(50),
    address TEXT,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    description TEXT,
    logo_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 兼职岗位表
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    responsibilities TEXT,
    salary_range VARCHAR(100),
    work_location TEXT,
    work_hours VARCHAR(100),
    recruit_count INTEGER DEFAULT 1,
    job_type VARCHAR(50) CHECK (job_type IN ('full_time', 'part_time', 'internship', 'remote')),
    category VARCHAR(100),
    skills_required TEXT[],
    application_deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'filled', 'expired')),
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 申请记录表
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected', 'cancelled')),
    cover_letter TEXT,
    resume_url TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    feedback TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, student_id)
);

-- 评价记录表
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewed_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_type VARCHAR(20) CHECK (review_type IN ('student_to_company', 'company_to_student')),
    anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 收藏表
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_verified ON companies(verified);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- 启用行级安全策略
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- 学生表策略
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '用户只能查看和修改自己的学生信息' AND tablename = 'students') THEN
        CREATE POLICY "用户只能查看和修改自己的学生信息" ON students
            FOR ALL USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- 企业表策略
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '用户只能查看和修改自己的企业信息' AND tablename = 'companies') THEN
        CREATE POLICY "用户只能查看和修改自己的企业信息" ON companies
            FOR ALL USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- 岗位表策略
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '任何人都可以查看岗位' AND tablename = 'jobs') THEN
        CREATE POLICY "任何人都可以查看岗位" ON jobs
            FOR SELECT USING (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '企业只能管理自己的岗位' AND tablename = 'jobs') THEN
        CREATE POLICY "企业只能管理自己的岗位" ON jobs
            FOR ALL USING (
                auth.uid()::text IN (SELECT user_id::text FROM companies WHERE id::text = company_id::text)
            );
    END IF;
END $$;

-- 申请记录策略
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '学生只能查看和管理自己的申请' AND tablename = 'applications') THEN
        CREATE POLICY "学生只能查看和管理自己的申请" ON applications
            FOR ALL USING (
                auth.uid()::text IN (SELECT user_id::text FROM students WHERE id::text = student_id::text)
            );
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '企业可以查看自己岗位的申请' AND tablename = 'applications') THEN
        CREATE POLICY "企业可以查看自己岗位的申请" ON applications
            FOR SELECT USING (
                auth.uid()::text IN (
                    SELECT c.user_id::text 
                    FROM companies c 
                    JOIN jobs j ON j.company_id::text = c.id::text 
                    WHERE j.id::text = applications.job_id::text
                )
            );
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '企业可以更新自己岗位的申请状态' AND tablename = 'applications') THEN
        CREATE POLICY "企业可以更新自己岗位的申请状态" ON applications
            FOR UPDATE USING (
                auth.uid()::text IN (
                    SELECT c.user_id::text 
                    FROM companies c 
                    JOIN jobs j ON j.company_id::text = c.id::text 
                    WHERE j.id::text = applications.job_id::text
                )
            )
            WITH CHECK (
                auth.uid()::text IN (
                    SELECT c.user_id::text 
                    FROM companies c 
                    JOIN jobs j ON j.company_id::text = c.id::text 
                    WHERE j.id::text = applications.job_id::text
                )
            );
    END IF;
END $$;

-- 评价表策略
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '用户只能查看和添加评价' AND tablename = 'reviews') THEN
        CREATE POLICY "用户只能查看和添加评价" ON reviews
            FOR ALL USING (
                auth.uid()::text = reviewer_id::text OR auth.uid()::text = reviewed_id::text
            );
    END IF;
END $$;

-- 收藏表策略
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '用户只能查看和管理自己的收藏' AND tablename = 'favorites') THEN
        CREATE POLICY "用户只能查看和管理自己的收藏" ON favorites
            FOR ALL USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- 更新时间触发器（将在005迁移文件中创建）
-- 注意：update_updated_at_column()函数将在005迁移文件中定义
-- 这里暂时注释掉触发器创建，避免函数不存在错误

-- CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();