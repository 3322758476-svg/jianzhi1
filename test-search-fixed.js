import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wptvwhlazelotraoagwt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwdHZ3aGxhemVsb3RyYW9hZ3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNTkxNzYsImV4cCI6MjA3NjczNTE3Nn0.kiyMw30CVO5GKxqyFi4zC73LiMha5g8v-iopV44VQGo'
);

async function testSearch() {
  console.log('测试修复后的搜索功能...');
  
  // 测试搜索前端开发
  console.log('\n1. 搜索"前端开发"：');
  const { data: frontendJobs, error: error1 } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'active')
    .or('title.ilike.%前端开发%,description.ilike.%前端开发%');
  
  if (error1) console.error('搜索失败:', error1);
  else {
    console.log('找到', frontendJobs?.length || 0, '个岗位');
    if (frontendJobs && frontendJobs.length > 0) {
      frontendJobs.forEach(job => {
        console.log('   -', job.title);
      });
    }
  }
  
  // 测试搜索新媒体
  console.log('\n2. 搜索"新媒体"：');
  const { data: mediaJobs, error: error2 } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'active')
    .or('title.ilike.%新媒体%,description.ilike.%新媒体%');
  
  if (error2) console.error('搜索失败:', error2);
  else {
    console.log('找到', mediaJobs?.length || 0, '个岗位');
    if (mediaJobs && mediaJobs.length > 0) {
      mediaJobs.forEach(job => {
        console.log('   -', job.title);
      });
    }
  }
  
  // 测试搜索数据分析
  console.log('\n3. 搜索"数据分析"：');
  const { data: dataJobs, error: error3 } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'active')
    .or('title.ilike.%数据分析%,description.ilike.%数据分析%');
  
  if (error3) console.error('搜索失败:', error3);
  else {
    console.log('找到', dataJobs?.length || 0, '个岗位');
    if (dataJobs && dataJobs.length > 0) {
      dataJobs.forEach(job => {
        console.log('   -', job.title);
      });
    }
  }
  
  // 测试搜索UI设计
  console.log('\n4. 搜索"UI设计"：');
  const { data: uiJobs, error: error4 } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'active')
    .or('title.ilike.%UI设计%,description.ilike.%UI设计%');
  
  if (error4) console.error('搜索失败:', error4);
  else {
    console.log('找到', uiJobs?.length || 0, '个岗位');
    if (uiJobs && uiJobs.length > 0) {
      uiJobs.forEach(job => {
        console.log('   -', job.title);
      });
    }
  }
  
  console.log('\n🎉 搜索功能测试完成！');
}

testSearch().catch(console.error);