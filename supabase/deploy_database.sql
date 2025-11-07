-- 兼职平台数据库部署脚本
-- 按顺序执行所有迁移文件

-- 1. 检查Supabase连接
SELECT '开始数据库部署...' as status;

-- 2. 执行初始架构迁移
\i migrations/001_initial_schema.sql
SELECT '初始架构迁移完成' as status;

-- 3. 执行通知和消息表迁移
\i migrations/002_notifications_messages.sql
SELECT '通知和消息表迁移完成' as status;

-- 4. 执行核心业务表迁移
\i migrations/003_core_tables.sql
SELECT '核心业务表迁移完成' as status;

-- 5. 执行增强架构迁移
\i migrations/004_enhanced_schema.sql
SELECT '增强架构迁移完成' as status;

-- 6. 执行完整数据库初始化
\i migrations/005_complete_database.sql
SELECT '完整数据库初始化完成' as status;

-- 7. 验证数据库部署
SELECT 
    '数据库部署完成！' as message,
    COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 8. 显示部署结果
SELECT 
    table_name,
    '✅ 创建成功' as status
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;