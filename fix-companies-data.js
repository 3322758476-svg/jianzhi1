import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wptvwhlazelotraoagwt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwdHZ3aGxhemVsb3RyYW9hZ3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNTkxNzYsImV4cCI6MjA3NjczNTE3Nn0.kiyMw30CVO5GKxqyFi4zC73LiMha5g8v-iopV44VQGo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCompaniesData() {
  console.log('🔧 修复companies表数据...\n');
  
  // 1. 首先检查jobs表中引用的company_id
  console.log('1. 检查jobs表中的company_id...');
  const { data: jobsData } = await supabase
    .from('jobs')
    .select('company_id')
    .limit(10);
  
  if (jobsData && jobsData.length > 0) {
    const companyIds = [...new Set(jobsData.map(job => job.company_id))];
    console.log('📋 jobs表中引用的company_id:', companyIds);
    
    // 2. 为这些company_id创建对应的公司数据
    console.log('\n2. 创建测试公司数据...');
    
    const testCompanies = [
      {
        id: '992833b5-50e1-4783-8e98-7f8f08aae022', // 使用jobs表中实际引用的ID
        company_name: '测试科技公司',
        business_license: 'TEST123456789',
        industry: '科技',
        scale: '中型企业',
        address: '北京市海淀区',
        contact_person: '张经理',
        contact_phone: '13800138000',
        contact_email: 'contact@testcompany.com',
        description: '一家专注于技术创新的科技公司',
        verified: true
      }
    ];
    
    for (const company of testCompanies) {
      const { data, error } = await supabase
        .from('companies')
        .upsert(company, { onConflict: 'id' });
      
      if (error) {
        console.error(`❌ 创建公司数据失败 (${company.company_name}):`, error);
      } else {
        console.log(`✅ 创建公司数据成功: ${company.company_name}`);
      }
    }
    
    // 3. 验证修复结果
    console.log('\n3. 验证修复结果...');
    const { data: companiesData } = await supabase
      .from('companies')
      .select('*');
    
    console.log(`✅ companies表现在有 ${companiesData?.length || 0} 条记录`);
    
    // 4. 测试推荐职位查询
    console.log('\n4. 测试推荐职位查询...');
    const { data: jobsWithCompanies, error: jobsError } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        salary_range,
        work_location,
        description,
        created_at,
        company_id,
        companies!inner(company_name)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6);
    
    if (jobsError) {
      console.error('❌ 推荐职位查询失败:', jobsError);
    } else {
      console.log('✅ 推荐职位查询成功，数量:', jobsWithCompanies?.length || 0);
      if (jobsWithCompanies && jobsWithCompanies.length > 0) {
        console.log('📊 修复后的职位数据:');
        jobsWithCompanies.forEach(job => {
          console.log(`  - ${job.title} (公司: ${job.companies?.company_name || '未知'})`);
        });
      }
    }
  }
  
  console.log('\n🎉 修复完成！');
}

fixCompaniesData().catch(console.error);