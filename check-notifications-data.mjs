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

async function checkNotificationsAndApplications() {
  try {
    console.log('🔍 检查通知表数据...');
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .limit(10);
    
    if (notifError) {
      console.log('❌ 查询通知表错误:', notifError);
    } else {
      console.log('📊 通知表数据:', notifications);
    }

    console.log('\n🔍 检查申请表数据...');
    const { data: applications, error: appError } = await supabase
      .from('applications')
      .select('*, jobs(title), students(user_id)')
      .limit(5);
    
    if (appError) {
      console.log('❌ 查询申请表错误:', appError);
    } else {
      console.log('📊 申请数据:', applications);
    }

    console.log('\n🔍 检查学生表数据...');
    const { data: students, error: stuError } = await supabase
      .from('students')
      .select('id, user_id')
      .limit(5);
    
    if (stuError) {
      console.log('❌ 查询学生表错误:', stuError);
    } else {
      console.log('📊 学生数据:', students);
    }

  } catch (err) {
    console.log('❌ 检查数据异常:', err);
  }
}

checkNotificationsAndApplications();