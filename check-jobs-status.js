import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wptvwhlazelotraoagwt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwdHZ3aGxhemVsb3RyYW9hZ3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNTkxNzYsImV4cCI6MjA3NjczNTE3Nn0.kiyMw30CVO5GKxqyFi4zC73LiMha5g8v-iopV44VQGo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJobsStatus() {
  console.log('🔍 检查jobs表状态字段...');
  
  // 查询所有jobs的status字段
  const { data: allJobs, error } = await supabase
    .from('jobs')
    .select('id, title, status, company_id')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('❌ 查询失败:', error);
    return;
  }
  
  console.log('📊 jobs表状态分布:');
  const statusCount = {};
  
  allJobs.forEach(job => {
    console.log(`- ID: ${job.id}, 标题: "${job.title}", 状态: "${job.status}", 公司ID: ${job.company_id}`);
    statusCount[job.status] = (statusCount[job.status] || 0) + 1;
  });
  
  console.log('\n📈 状态统计:');
  Object.entries(statusCount).forEach(([status, count]) => {
    console.log(`  ${status}: ${count} 条记录`);
  });
  
  // 检查是否有status为null或空的情况
  const invalidStatus = allJobs.filter(job => !job.status || job.status.trim() === '');
  if (invalidStatus.length > 0) {
    console.log('\n⚠️  发现无效状态记录:');
    invalidStatus.forEach(job => {
      console.log(`  ID: ${job.id}, 标题: "${job.title}", 状态: ${job.status}`);
    });
  }
}

checkJobsStatus().catch(console.error);