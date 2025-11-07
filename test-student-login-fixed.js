import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testStudentLogin() {
  console.log('🧪 开始测试学生登录功能...\n')

  // 测试数据
  const testEmail = 'test.student.verified@gmail.com'
  const testPassword = 'TestPassword123!'
  
  console.log('📝 测试数据:')
  console.log('邮箱:', testEmail)
  console.log('密码:', testPassword)
  console.log('')

  try {
    // 1. 尝试登录
    console.log('1️⃣ 尝试登录学生账号...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (error) {
      console.log('❌ 登录失败:', error.message)
      
      if (error.message.includes('Email not confirmed')) {
        console.log('⚠️ 邮箱未验证，这是当前的主要问题')
        console.log('💡 解决方案: 需要在 Supabase 仪表板中禁用邮箱验证')
      } else if (error.message.includes('Invalid login credentials')) {
        console.log('⚠️ 账号或密码错误，请检查测试数据')
      }
      
      return
    }

    console.log('✅ 登录成功!')
    console.log('用户ID:', data.user.id)
    console.log('邮箱:', data.user.email)
    console.log('')

    // 2. 获取用户档案
    console.log('2️⃣ 获取用户档案信息...')
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single()

    if (profileError) {
      console.log('⚠️ 获取用户档案失败:', profileError.message)
    } else {
      console.log('✅ 用户档案信息:')
      console.log('角色:', profileData.role)
      console.log('创建时间:', profileData.created_at)
      console.log('')
    }

    // 3. 获取学生记录
    console.log('3️⃣ 获取学生记录...')
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', data.user.id)
      .single()

    if (studentError) {
      console.log('⚠️ 获取学生记录失败:', studentError.message)
      console.log('💡 学生记录可能尚未创建')
    } else {
      console.log('✅ 学生记录信息:')
      console.log('姓名:', studentData.real_name)
      console.log('学号:', studentData.student_id)
      console.log('学校:', studentData.school)
      console.log('专业:', studentData.major)
      console.log('')
    }

    // 4. 测试会话保持
    console.log('4️⃣ 测试会话保持...')
    const { data: sessionData } = await supabase.auth.getSession()
    
    if (sessionData.session) {
      console.log('✅ 会话保持正常')
      console.log('访问令牌:', sessionData.session.access_token.substring(0, 20) + '...')
    } else {
      console.log('❌ 会话保持失败')
    }

    console.log('\n🎉 学生登录测试完成!')

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
  }
}

// 运行测试
testStudentLogin()