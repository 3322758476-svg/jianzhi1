-- 临时禁用行级安全策略（仅用于开发测试）
-- 在Supabase SQL编辑器中执行以下语句：

-- 禁用students表的RLS
ALTER TABLE students DISABLE ROW LEVEL SECURITY;

-- 禁用companies表的RLS  
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- 禁用applications表的RLS
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;

-- 创建测试数据
INSERT INTO students (user_id, student_id, real_name, school, major, grade, phone) 
VALUES ('12345678-1234-1234-1234-123456789abc', '20230001', '测试学生', '测试大学', '计算机科学', '大三', '13800138000');

INSERT INTO companies (user_id, company_name, industry) 
VALUES ('87654321-4321-4321-4321-210987654321', '测试企业', '互联网');

INSERT INTO jobs (title, description, company_id) 
VALUES ('前端开发工程师', '负责前端开发工作', (SELECT id FROM companies LIMIT 1));

INSERT INTO applications (student_id, job_id, status) 
VALUES (
  (SELECT id FROM students LIMIT 1), 
  (SELECT id FROM jobs LIMIT 1), 
  'pending'
);

-- 测试完成后重新启用RLS
-- ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE applications ENABLE ROW LEVEL SECURITY;