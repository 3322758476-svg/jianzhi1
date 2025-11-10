const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 环境变量未设置');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 测试岗位查询
async function testJobAccess() {
    console.log('🔍 测试岗位访问权限...');
    
    try {
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('❌ 岗位查询失败:', error.message);
            if (error.code === '42501') {
                console.log('💡 需要修复jobs表的行级安全策略');
            }
        } else {
            console.log('✅ 岗位查询成功');
        }
    } catch (err) {
        console.error('❌ 测试异常:', err.message);
    }
}

// 测试权限表
async function testPermissionTables() {
    console.log('\n🔍 检查权限相关表...');
    
    const tables = ['user_roles', 'companies'];
    
    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('count')
                .limit(1);
                
            if (error && error.code === '42P01') {
                console.log(`❌ ${table}表不存在`);
            } else if (error) {
                console.log(`⚠️  ${table}表访问错误: ${error.message}`);
            } else {
                console.log(`✅ ${table}表可访问`);
            }
        } catch (err) {
            console.log(`❌ ${table}表检查异常: ${err.message}`);
        }
    }
}

async function main() {
    await testJobAccess();
    await testPermissionTables();
    
    console.log('\n💡 建议: 执行SQL脚本修复jobs表权限策略');
}

main();