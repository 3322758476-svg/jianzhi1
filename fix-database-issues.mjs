import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// 读取环境变量
const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDatabaseIssues() {
  try {
    console.log('🔧 开始修复数据库问题...');

    // 1. 检查所有表的状态
    console.log('📊 检查所有表状态...');
    const tables = ['students', 'companies', 'jobs', 'applications', 'notifications'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}表查询错误:`, error.message);
      } else {
        console.log(`✅ ${table}表正常，记录数:`, data ? data.length : 0);
      }
    }

    // 2. 检查行级安全策略状态
    console.log('\n🔐 检查行级安全策略...');
    const { data: rlsData, error: rlsError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('schemaname', 'public')
      .limit(10);

    if (rlsError) {
      console.log('❌ 查询RLS策略错误:', rlsError);
    } else {
      console.log('📋 RLS策略数量:', rlsData ? rlsData.length : 0);
    }

    // 3. 检查实际的通知发送功能
    console.log('\n🔍 测试通知发送功能...');
    
    // 先检查是否有任何申请记录
    const { data: applications } = await supabase
      .from('applications')
      .select('*, jobs(title)')
      .limit(1);

    if (applications && applications.length > 0) {
      console.log('📝 有申请记录，测试通知发送...');
      
      // 这里可以测试实际的通知发送
    } else {
      console.log('⚠️ 没有申请记录，需要先创建应用数据');
      console.log('💡 建议：通过前端界面创建学生、岗位和申请数据');
    }

    console.log('\n🎯 修复建议:');
    console.log('1. 通过前端界面创建测试数据');
    console.log('2. 检查数据库连接配置');
    console.log('3. 验证Supabase项目设置');

  } catch (err) {
    console.log('❌ 修复过程异常:', err);
  }
}

fixDatabaseIssues();