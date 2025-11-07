-- 007_add_recruit_count_to_jobs.sql
-- 为 jobs 表添加 recruit_count 字段

-- 1. 为 jobs 表添加 recruit_count 字段
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS recruit_count INTEGER DEFAULT 1;

-- 2. 添加注释说明
COMMENT ON COLUMN jobs.recruit_count IS '招聘人数';

-- 3. 更新现有记录的默认值
UPDATE jobs SET recruit_count = 1 WHERE recruit_count IS NULL;

-- 4. 添加约束确保招聘人数为正数
ALTER TABLE jobs 
ADD CONSTRAINT check_recruit_count_positive 
CHECK (recruit_count > 0);

-- 5. 完成消息
COMMENT ON TABLE jobs IS '兼职岗位表 - 包含招聘人数字段';

-- 6. 验证修改
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'jobs' 
    AND column_name = 'recruit_count';