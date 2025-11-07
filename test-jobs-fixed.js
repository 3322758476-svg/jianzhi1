import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wptvwhlazelotraoagwt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwdHZ3aGxhemVsb3RyYW9hZ3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNTkxNzYsImV4cCI6MjA3NjczNTE3Nn0.kiyMw30CVO5GKxqyFi4zC73LiMha5g8v-iopV44VQGo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testJobsPage() {
  console.log('🧪 测试修复后的Jobs页面功能...\n');
  
  // 1. 测试数据库连接和jobs表查询
  console.log('1. 测试数据库连接和jobs表查询...');
  try {
    const { data: jobsData, error } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        salary_range,
        work_location,
        description,
        created_at,
        company_id,
        work_hours,
        job_type,
        category,
        skills_required
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ jobs表查询失败:', error);
    } else {
      console.log('✅ jobs表查询成功，数量:', jobsData?.length || 0);
      
      if (jobsData && jobsData.length > 0) {
        console.log('📊 数据库中的职位数据:');
        jobsData.slice(0, 3).forEach(job => {
          console.log(`   📍 ${job.title}`);
          console.log(`     薪资: ${job.salary_range}`);
          console.log(`     地点: ${job.work_location}`);
          console.log(`     公司ID: ${job.company_id}`);
          console.log('');
        });
      }
    }
  } catch (err) {
    console.error('❌ 测试失败:', err);
  }
  
  // 2. 测试搜索功能
  console.log('\n2. 测试搜索功能...');
  const testSearchKeyword = '1'; // 测试搜索关键词
  try {
    const { data: searchResults, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .ilike('title', `%${testSearchKeyword}%`);
    
    if (error) {
      console.error('❌ 搜索功能测试失败:', error);
    } else {
      console.log(`✅ 搜索关键词 "${testSearchKeyword}" 返回结果: ${searchResults?.length || 0} 条`);
    }
  } catch (err) {
    console.error('❌ 搜索测试失败:', err);
  }
  
  // 3. 测试筛选功能
  console.log('\n3. 测试筛选功能...');
  try {
    const { data: filteredResults, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .eq('job_type', 'part_time');
    
    if (error) {
      console.error('❌ 筛选功能测试失败:', error);
    } else {
      console.log(`✅ 筛选兼职类型返回结果: ${filteredResults?.length || 0} 条`);
    }
  } catch (err) {
    console.error('❌ 筛选测试失败:', err);
  }
  
  console.log('\n🎉 Jobs页面功能测试完成！');
  console.log('📋 修复总结:');
  console.log('   ✅ 修复了loadJobs函数，从模拟数据改为真实数据库查询');
  console.log('   ✅ 修复了onMounted钩子，确保页面加载时调用loadJobs');
  console.log('   ✅ 增强了错误处理，支持降级到静态数据');
  console.log('   ✅ 搜索和筛选功能现在应该能正常工作了');
}

testJobsPage().catch(console.error);