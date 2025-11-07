import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testCompleteStudentFlow() {
  console.log('🎓 开始测试学生完整流程（注册 + 登录）...\n')

  // 生成唯一的测试数据
  const timestamp = Date.now()
  const testEmail = `test.student.${timestamp}@gmail.com`
  const testPassword = 'TestPassword123!'
  const testName = `测试学生${timestamp}`
  const testStudentId = `S${timestamp}`
  const testSchool = '测试大学'
  const testMajor = '计算机科学'
  
  console.log('📝 测试数据:')
  console.log('邮箱:', testEmail)
  console.log('密码:', testPassword)
  console.log('姓名:', testName)
  console.log('学号:', testStudentId)
  console.log('学校:', testSchool)
  console.log('专业:', testMajor)
  console.log('')

  try {
    // 1. 注册学生账号
    console.log('1️⃣ 注册学生账号...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          username: testName,
          role: 'student',
          phone: '',
          school: testSchool,
          major: testMajor,
          company_name: '',
          license: '',
          contact_person: '',
          contact_phone: ''
        }
      }
    })

    if (signUpError) {
      console.log('❌ 注册失败:', signUpError.message)
      
      if (signUpError.message.includes('Email address is invalid')) {
        console.log('⚠️ 邮箱格式无效，请使用有效的邮箱地址')
      } else if (signUpError.message.includes('User already registered')) {
        console.log('⚠️ 用户已存在，尝试直接登录')
        await testLoginOnly(testEmail, testPassword)
        return
      }
      
      return
    }

    console.log('✅ 注册成功!')
    console.log('用户ID:', signUpData.user.id)
    console.log('邮箱:', signUpData.user.email)
    
    if (signUpData.session) {
      console.log('🔐 自动登录成功')
    } else {
      console.log('⚠️ 需要邮箱验证后才能登录')
      console.log('💡 当前主要问题: Supabase 默认要求邮箱验证')
    }
    console.log('')

    // 2. 尝试立即登录（如果注册时没有自动登录）
    if (!signUpData.session) {
      console.log('2️⃣ 尝试立即登录...')
      await testLoginOnly(testEmail, testPassword)
    } else {
      // 如果注册时已经自动登录，测试后续流程
      console.log('2️⃣ 注册时已自动登录，测试后续流程...')
      await testPostLogin(signUpData.user.id)
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
  }
}

async function testLoginOnly(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (error) {
      console.log('❌ 登录失败:', error.message)
      
      if (error.message.includes('Email not confirmed')) {
        console.log('⚠️ 邮箱未验证，这是当前的主要问题')
        console.log('💡 解决方案: 需要在 Supabase 仪表板中禁用邮箱验证')
        console.log('   1. 登录 Supabase 控制台')
        console.log('   2. 进入 Authentication > Settings')
        console.log('   3. 禁用 "Enable email confirmations"')
        console.log('   4. 保存设置')
      }
      
      return
    }

    console.log('✅ 登录成功!')
    console.log('用户ID:', data.user.id)
    console.log('')

    // 测试登录后的流程
    await testPostLogin(data.user.id)

  } catch (error) {
    console.error('❌ 登录测试过程中发生错误:', error)
  }
}

async function testPostLogin(userId) {
  try {
    // 3. 创建用户档案
    console.log('3️⃣ 创建用户档案...')
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        role: 'student',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (profileError) {
      console.log('⚠️ 创建用户档案失败:', profileError.message)
      
      if (profileError.message.includes('duplicate key')) {
        console.log('💡 用户档案已存在，尝试获取现有档案')
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single()
        
        if (existingProfile) {
          console.log('✅ 获取现有用户档案成功')
          console.log('角色:', existingProfile.role)
        }
      }
    } else {
      console.log('✅ 创建用户档案成功')
      console.log('档案ID:', profileData.id)
      console.log('角色:', profileData.role)
    }
    console.log('')

    // 4. 创建学生记录
    console.log('4️⃣ 创建学生记录...')
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .insert({
        user_id: userId,
        real_name: '测试学生',
        student_id: `S${Date.now()}`,
        school: '测试大学',
        major: '计算机科学',
        phone: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (studentError) {
      console.log('⚠️ 创建学生记录失败:', studentError.message)
      
      if (studentError.message.includes('new row violates row-level security policy')) {
        console.log('💡 RLS策略限制: 需要调整数据库策略或使用服务角色')
      }
    } else {
      console.log('✅ 创建学生记录成功')
      console.log('学生ID:', studentData.id)
      console.log('姓名:', studentData.real_name)
      console.log('学号:', studentData.student_id)
    }
    console.log('')

    // 5. 测试会话保持
    console.log('5️⃣ 测试会话保持...')
    const { data: sessionData } = await supabase.auth.getSession()
    
    if (sessionData.session) {
      console.log('✅ 会话保持正常')
      console.log('访问令牌有效')
    } else {
      console.log('❌ 会话保持失败')
    }

    console.log('\n🎉 学生完整流程测试完成!')

  } catch (error) {
    console.error('❌ 登录后流程测试过程中发生错误:', error)
  }
}

// 运行测试
console.log('🚀 开始学生完整流程测试...\n')
testCompleteStudentFlow()