import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wptvwhlazelotraoagwt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwdHZ3aGxhemVsb3RyYW9hZ3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNTkxNzYsImV4cCI6MjA3NjczNTE3Nn0.kiyMw30CVO5GKxqyFi4zC73LiMha5g8v-iopV44VQGo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFixedHomeQuery() {
  console.log('🧪 测试修复后的首页查询...\n');
  
  // 模拟Home.vue中的修复逻辑
  try {
    console.log('1. 查询jobs表...');
    const { data: jobsData, error } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        salary_range,
        work_location,
        description,
        created_at,
        company_id
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6);
    
    if (error) throw error;
    
    if (jobsData && jobsData.length > 0) {
      console.log('✅ jobs查询成功，数量:', jobsData.length);
      
      // 模拟修复后的公司信息获取逻辑
      let companiesMap = new Map();
      try {
        console.log('2. 尝试获取公司信息...');
        const companyIds = [...new Set(jobsData.map(job => job.company_id))];
        const { data: companiesData } = await supabase
          .from('companies')
          .select('id, company_name')
          .in('id', companyIds);
        
        companiesMap = new Map(companiesData?.map(c => [c.id, c.company_name]) || []);
        console.log('✅ 公司信息获取成功');
      } catch (companiesError) {
        console.warn('⚠️ 获取公司信息失败，使用默认公司名:', companiesError.message);
      }
      
      // 格式化时间函数（模拟）
      const formatTimeAgo = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return '今天';
        if (diffDays === 1) return '昨天';
        if (diffDays < 7) return `${diffDays}天前`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
        return `${Math.floor(diffDays / 30)}月前`;
      };
      
      // 生成最终职位数据
      const featuredJobs = jobsData.map(job => ({
        id: job.id,
        title: job.title,
        company: companiesMap.get(job.company_id) || '招聘公司',
        salary: job.salary_range,
        location: job.work_location,
        description: job.description,
        createdAt: formatTimeAgo(job.created_at)
      }));
      
      console.log('\n3. 最终职位数据:');
      featuredJobs.forEach(job => {
        console.log(`   📍 ${job.title}`);
        console.log(`     公司: ${job.company}`);
        console.log(`     薪资: ${job.salary}`);
        console.log(`     地点: ${job.location}`);
        console.log(`     发布时间: ${job.createdAt}`);
        console.log('');
      });
      
      console.log('🎉 修复成功！首页现在应该能正常显示推荐职位了。');
      
    } else {
      console.log('ℹ️ 没有找到活跃的职位数据');
    }
    
  } catch (error) {
    console.error('❌ 查询失败:', error);
  }
}

testFixedHomeQuery().catch(console.error);