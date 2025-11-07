import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wptvwhlazelotraoagwt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwdHZ3aGxhemVsb3RyYW9hZ3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNTkxNzYsImV4cCI6MjA3NjczNTE3Nn0.kiyMw30CVO5GKxqyFi4zC73LiMha5g8v-iopV44VQGo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseIssue() {
  console.log('🔍 诊断推荐职位加载问题...\n');
  
  // 1. 测试jobs表查询
  console.log('1. 测试jobs表查询...');
  const { data: jobsData, error: jobsError } = await supabase
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
  
  if (jobsError) {
    console.error('❌ jobs查询失败:', jobsError);
  } else {
    console.log('✅ jobs查询成功，数量:', jobsData?.length || 0);
    if (jobsData && jobsData.length > 0) {
      console.log('📊 jobs数据:', JSON.stringify(jobsData, null, 2));
    }
  }
  
  // 2. 测试companies表查询
  console.log('\n2. 测试companies表查询...');
  if (jobsData && jobsData.length > 0) {
    const companyIds = [...new Set(jobsData.map(job => job.company_id))];
    const { data: companiesData, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name')
      .in('id', companyIds);
    
    if (companiesError) {
      console.error('❌ companies查询失败:', companiesError);
    } else {
      console.log('✅ companies查询成功，数量:', companiesData?.length || 0);
      console.log('📊 companies数据:', JSON.stringify(companiesData, null, 2));
    }
  }
  
  // 3. 检查companies表是否存在
  console.log('\n3. 检查companies表结构...');
  const { data: tableCheck, error: tableError } = await supabase
    .from('companies')
    .select('*')
    .limit(1);
  
  if (tableError) {
    console.error('❌ companies表检查失败:', tableError);
  } else {
    console.log('✅ companies表存在，字段结构:', tableCheck && tableCheck.length > 0 ? Object.keys(tableCheck[0]) : '空表');
  }
}

diagnoseIssue().catch(console.error);