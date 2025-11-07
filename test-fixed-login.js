// 测试修复后的学生注册登录功能
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// 加载环境变量
config()

// 创建 Supabase 客户端
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testFixedStudentLogin() {
  console.log('🧪 开始测试修复后的学生注册登录功能...\n')

  // 生成唯一的测试数据
  const timestamp = Date.now()
  const testEmail = `test.student${timestamp}@example.com`
  const testPassword = 'TestPassword123!'

  console.log('📝 测试数据:')
  console.log('邮箱:', testEmail)
  console.log('密码:', testPassword)
  console.log('')

  try {
    // 1. 注册学生账号
    console.log('1️⃣ 注册学生账号...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          username: `teststudent${timestamp}`,
          role: 'student',
          phone: '',
          school: '测试大学',
          major: '测试专业'
        }
      }
    })

    if (signUpError) {
      console.error('❌ 注册失败:', signUpError.message)
      return
    }

    console.log('✅ 注册成功! 用户ID:', signUpData.user?.id)
    console.log('邮箱验证状态:', signUpData.user?.email_confirmed_at ? '已验证' : '未验证')
    console.log('自动登录状态:', signUpData.session ? '已自动登录' : '需要邮箱验证')
    console.log('')

    // 2. 立即登录测试
    console.log('2️⃣ 立即登录测试...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (loginError) {
      console.log('❌ 登录失败:', loginError.message)
      
      // 如果是邮箱验证问题，提供解决方案
      if (loginError.message.includes('Email not confirmed')) {
        console.log('⚠️ 邮箱未验证，这是当前的主要问题')
        console.log('💡 解决方案:')
        console.log('   1. 在 Supabase 仪表板中禁用邮箱验证')
        console.log('   2. 或者手动确认邮箱地址')
        console.log('')
        
        // 尝试使用管理员API确认邮箱（仅限开发环境）
        console.log('🛠️ 尝试使用管理员API确认邮箱...')
        try {
          // 注意：这需要管理员权限，仅用于测试
          const { error: confirmError } = await supabase.auth.admin.updateUserById(
            signUpData.user.id,
            { email_confirm: true }
          )
          
          if (confirmError) {
            console.log('⚠️ 无法自动确认邮箱（需要管理员权限）')
          } else {
            console.log('✅ 邮箱确认成功，重新登录...')
            
            // 重新登录
            const { data: reloginData, error: reloginError } = await supabase.auth.signInWithPassword({
              email: testEmail,
              password: testPassword
            })
            
            if (reloginError) {
              console.error('❌ 重新登录失败:', reloginError.message)
            } else {
              console.log('✅ 重新登录成功!')
              console.log('🔑 会话令牌:', reloginData.session?.access_token?.substring(0, 20) + '...')
              
              // 继续测试后续流程
              await testPostLogin(reloginData.user.id)
            }
          }
        } catch (adminError) {
          console.log('⚠️ 管理员API调用失败，需要手动确认邮箱')
        }
      }
    } else {
      console.log('✅ 登录成功!')
      console.log('🔑 会话令牌:', loginData.session?.access_token?.substring(0, 20) + '...')
      
      // 继续测试后续流程
      await testPostLogin(loginData.user.id)
    }

  } catch (error) {
    console.error('❌ 测试过程中发生异常:', error)
  }
}

async function testPostLogin(userId) {
  console.log('')
  console.log('3️⃣ 测试登录后功能...')
  
  try {
    // 检查学生记录是否自动创建
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (studentError) {
      console.log('⚠️ 学生记录不存在或查询失败:', studentError.message)
      console.log('💡 学生记录将在首次登录时自动创建')
    } else {
      console.log('✅ 学生记录已存在:', studentData)
    }

    // 测试获取用户信息
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error('❌ 获取用户信息失败:', userError.message)
    } else {
      console.log('✅ 用户信息获取成功:')
      console.log('   ID:', userData.user.id)
      console.log('   邮箱:', userData.user.email)
      console.log('   角色:', userData.user.user_metadata?.role)
    }

    console.log('')
    console.log('🎉 测试完成!')
    console.log('📊 测试结果总结:')
    console.log('   ✅ 注册成功')
    console.log('   ✅ 登录流程正常')
    console.log('   💡 邮箱验证是主要限制因素')
    console.log('')
    console.log('💡 生产环境解决方案:')
    console.log('   1. 在 Supabase 仪表板中禁用邮箱验证')
    console.log('   2. 或者实现邮箱验证流程')
    console.log('   3. 或者使用测试邮箱服务')

  } catch (error) {
    console.error('❌ 登录后功能测试失败:', error)
  }
}

// 运行测试
testFixedStudentLogin()