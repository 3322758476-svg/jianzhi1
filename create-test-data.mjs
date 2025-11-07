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

async function createTestData() {
  try {
    console.log('🚀 开始创建测试数据...');

    // 1. 创建测试学生
    console.log('📝 创建测试学生...');
    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert({
        user_id: '12345678-1234-1234-1234-123456789abc',
        student_id: '20230001',
        real_name: '测试学生',
        school: '测试大学',
        major: '计算机科学',
        grade: '大三',
        phone: '13800138000',
        skills: ['JavaScript', 'Vue.js', 'TypeScript'],
        experience: '有前端开发经验',
        expected_salary: '8k-15k',
        preferred_locations: ['北京', '上海'],
        preferred_job_types: ['前端开发', '全栈开发'],
        resume_url: 'https://example.com/resume.pdf'
      })
      .select()
      .single();

    if (studentError) {
      console.log('❌ 创建学生失败:', studentError);
      return;
    }
    console.log('✅ 学生创建成功:', student);

    // 2. 创建测试岗位
    console.log('📝 创建测试岗位...');
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        title: '前端开发工程师',
        description: '负责前端开发工作',
        requirements: '熟悉Vue.js, TypeScript',
        salary_range: '8k-15k',
        location: '北京',
        company_id: 'test-company-id'
      })
      .select()
      .single();

    if (jobError) {
      console.log('❌ 创建岗位失败:', jobError);
      return;
    }
    console.log('✅ 岗位创建成功:', job);

    // 3. 创建测试申请
    console.log('📝 创建测试申请...');
    const { data: application, error: appError } = await supabase
      .from('applications')
      .insert({
        student_id: student.id,
        job_id: job.id,
        status: 'pending',
        cover_letter: '测试申请信',
        applied_at: new Date().toISOString()
      })
      .select()
      .single();

    if (appError) {
      console.log('❌ 创建申请失败:', appError);
      return;
    }
    console.log('✅ 申请创建成功:', application);

    console.log('🎉 测试数据创建完成！');
    console.log('📊 现在可以测试企业端发送通知功能了');

  } catch (err) {
    console.log('❌ 创建测试数据异常:', err);
  }
}

createTestData();