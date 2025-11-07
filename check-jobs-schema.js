import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wptvwhlazelotraoagwt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwdHZ3aGxhemVsb3RyYW9hZ3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNTkxNzYsImV4cCI6MjA3NjczNTE3Nn0.kiyMw30CVO5GKxqyFi4zC73LiMha5g8v-iopV44VQGo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJobsSchema() {
  console.log('🔍 检查jobs表实际字段结构...');
  
  // 查询一条记录来查看实际字段
  const { data: jobRecord, error } = await supabase
    .from('jobs')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('❌ 查询失败:', error);
    return;
  }
  
  if (jobRecord && jobRecord.length > 0) {
    console.log('📋 jobs表实际字段结构:');
    const fields = Object.keys(jobRecord[0]);
    fields.forEach(field => {
      console.log(`  - ${field}`);
    });
    
    console.log('\n📊 第一条记录数据:');
    console.log(JSON.stringify(jobRecord[0], null, 2));
  }
}

checkJobsSchema().catch(console.error);