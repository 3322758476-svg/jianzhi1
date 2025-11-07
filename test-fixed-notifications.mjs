import { createClient } from '@supabase/supabase-js';

// 从环境变量读取配置
const supabaseUrl = 'https://wptvwhlazelotraoagwt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwdHZ3aGxhemVsb3RyYW9hZ3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNTkxNzYsImV4cCI6MjA3NjczNTE3Nn0.kiyMw30CVO5GKxqyFi4zC73LiMha5g8v-iopV44VQGo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNotificationFlow() {
  try {
    console.log('=== 测试通知功能修复 ===\n');
    
    // 1. 检查通知表
    console.log('1. 检查通知表状态...');
    const { data: notifications, error: notifyError } = await supabase
      .from('notifications')
      .select('*')
      .limit(5);
    
    if (notifyError) {
      console.log('❌ 查询通知表错误:', notifyError);
    } else {
      console.log('✅ 通知表可正常访问');
      console.log('   当前通知数量:', notifications.length);
    }
    
    // 2. 检查申请表结构
    console.log('\n2. 检查申请表结构...');
    const { data: applications, error: appError } = await supabase
      .from('applications')
      .select('id, student_id, status')
      .limit(3);
    
    if (appError) {
      console.log('❌ 查询申请表错误:', appError);
    } else if (applications && applications.length > 0) {
      console.log('✅ 申请表可正常访问');
      console.log('   示例申请数据:', applications[0]);
      
      // 3. 测试学生信息查询
      console.log('\n3. 测试学生信息查询...');
      const sampleApp = applications[0];
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, user_id')
        .eq('id', sampleApp.student_id)
        .single();
      
      if (studentError) {
        console.log('❌ 查询学生信息错误:', studentError);
      } else if (studentData) {
        console.log('✅ 学生信息查询成功');
        console.log('   学生ID:', studentData.id);
        console.log('   用户ID:', studentData.user_id);
        
        // 4. 测试通知创建
        console.log('\n4. 测试通知创建...');
        const { data: newNotify, error: createError } = await supabase
          .from('notifications')
          .insert({
            user_id: studentData.user_id,
            type: 'test',
            title: '测试通知',
            description: '这是一个测试通知，验证修复后的通知功能',
            important: false
          })
          .select();
        
        if (createError) {
          console.log('❌ 创建通知错误:', createError);
        } else {
          console.log('✅ 通知创建成功');
          console.log('   新通知ID:', newNotify[0].id);
          
          // 5. 验证通知已创建
          console.log('\n5. 验证通知已创建...');
          const { data: verifyNotify, error: verifyError } = await supabase
            .from('notifications')
            .select('*')
            .eq('id', newNotify[0].id)
            .single();
          
          if (verifyError) {
            console.log('❌ 验证通知错误:', verifyError);
          } else {
            console.log('✅ 通知验证成功');
            console.log('   通知详情:', {
              id: verifyNotify.id,
              user_id: verifyNotify.user_id,
              type: verifyNotify.type,
              title: verifyNotify.title
            });
          }
        }
      }
    } else {
      console.log('⚠️ 申请表中暂无数据，无法进行完整测试');
    }
    
    console.log('\n=== 测试完成 ===');
    
  } catch (err) {
    console.log('❌ 测试异常:', err);
  }
}

async function main() {
  await testNotificationFlow();
}

main();