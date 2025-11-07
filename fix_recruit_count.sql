-- 修复 jobs 表缺失的 recruit_count 字段
-- 请将此 SQL 在 Supabase SQL 编辑器中执行

-- 1. 为 jobs 表添加 recruit_count 字段
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS recruit_count INTEGER DEFAULT 1;

-- 2. 更新现有记录的默认值
UPDATE jobs SET recruit_count = 1 WHERE recruit_count IS NULL;

-- 3. 添加约束确保招聘人数为正数
ALTER TABLE jobs 
ADD CONSTRAINT check_recruit_count_positive 
CHECK (recruit_count > 0);

-- 4. 验证修改
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'jobs' 
    AND column_name = 'recruit_count';

-- 5. 显示修改结果
SELECT '修复完成！jobs 表现在包含 recruit_count 字段' as result;