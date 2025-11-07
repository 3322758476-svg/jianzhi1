const { createClient } = require('@supabase/supabase-js');

// 从环境变量读取配置
const supabaseUrl = 'https://wptvwhlazelotraoagwt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwdHZ3aGxhemVsb3RyYW9hZ3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNTkxNzYsImV4cCI6MjA3NjczNTE3Nn0.kiyMw30CVO5GKxqyFi4zC73LiMha5g8v-iopV44VQGo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNotifications() {
  try {
    console.log('开始检查通知表...');
    
    // 检查通知表是否存在
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('查询通知表错误:', error);
      return;
    }
    
    console.log('最近的通知数据:', notifications);
    console.log('通知数量:', notifications ? notifications.length : 0);
    
  } catch (err) {
    console.log('检查通知表异常:', err);
  }
}

async function testNotificationCreation() {
  try {
    console.log('\n测试创建通知...');
    
    // 模拟创建一个测试通知
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: 'test-user-id',
        type: 'test',
        title: '测试通知',
        description: '这是一个测试通知',
        important: false
      })
      .select();
    
    if (error) {
      console.log('创建通知错误:', error);
    } else {
      console.log('创建通知成功:', data);
    }
    
  } catch (err) {
    console.log('测试创建通知异常:', err);
  }
}

async function main() {
  await checkNotifications();
  await testNotificationCreation();
}

main();