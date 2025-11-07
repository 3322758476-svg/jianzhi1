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

async function testNotificationFlow() {
  try {
    console.log('🔍 测试通知发送流程...');

    // 1. 检查现有数据
    console.log('📊 检查现有数据...');
    const { data: applications } = await supabase
      .from('applications')
      .select('*, jobs(title)')
      .limit(5);
    
    console.log('申请数据:', applications);

    // 2. 如果有申请数据，测试通知发送
    if (applications && applications.length > 0) {
      const application = applications[0];
      console.log('📝 测试发送面试通知...');
      
      // 获取学生信息
      const { data: studentData } = await supabase
        .from('students')
        .select('user_id')
        .eq('id', application.student_id)
        .single();

      if (studentData) {
        console.log('👨‍🎓 学生信息:', studentData);
        
        // 创建通知
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: studentData.user_id,
            type: 'interview',
            title: '面试通知',
            description: `恭喜！您的申请"${application.jobs?.title || '未知岗位'}"已通过审核。`,
            related_id: application.id,
            important: true
          });

        if (notificationError) {
          console.log('❌ 创建通知失败:', notificationError);
        } else {
          console.log('✅ 通知发送成功！');
        }
      }
    } else {
      console.log('⚠️ 没有申请数据，无法测试通知发送');
    }

    // 3. 检查通知表
    console.log('📊 检查通知表...');
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .limit(10);
    
    console.log('通知数据:', notifications);

  } catch (err) {
    console.log('❌ 测试异常:', err);
  }
}

testNotificationFlow();