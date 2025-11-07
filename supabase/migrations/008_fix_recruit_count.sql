-- 修复 jobs 表缺失的 recruit_count 字段
-- 迁移文件：008_fix_recruit_count.sql

-- 1. 为 jobs 表添加 recruit_count 字段
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS recruit_count INTEGER DEFAULT 1;

-- 2. 更新现有记录的默认值
UPDATE jobs SET recruit_count = 1 WHERE recruit_count IS NULL;

-- 3. 添加约束确保招聘人数为正数
ALTER TABLE jobs 
ADD CONSTRAINT check_recruit_count_positive 
CHECK (recruit_count > 0);

-- 4. 更新 RLS 策略确保字段可访问
-- 确保所有用户都能看到招聘人数

-- 5. 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_jobs_recruit_count 
ON jobs(recruit_count);

-- 6. 验证修改结果
DO $$
BEGIN
    -- 检查字段是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'recruit_count'
    ) THEN
        RAISE EXCEPTION '字段添加失败';
    END IF;
    
    -- 检查约束是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'jobs' AND constraint_name = 'check_recruit_count_positive'
    ) THEN
        RAISE EXCEPTION '约束添加失败';
    END IF;
    
    -- 检查索引是否存在
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'jobs' AND indexname = 'idx_jobs_recruit_count'
    ) THEN
        RAISE EXCEPTION '索引创建失败';
    END IF;
    
    RAISE NOTICE 'recruit_count 字段修复完成';
END $$;

-- 7. 更新相关视图和函数（如果需要）
-- 确保所有依赖 jobs 表的视图和函数都能正确处理新字段

-- 8. 记录迁移日志
INSERT INTO audit_logs (action_type, table_name, description) 
VALUES ('migration', 'jobs', '修复 recruit_count 字段');