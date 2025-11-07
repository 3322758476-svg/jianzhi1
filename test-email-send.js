// 邮件发送测试脚本
const { createClient } = require('@supabase/supabase-js')

// 从环境变量或配置文件读取Supabase配置
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testEmailSending() {
  console.log('🧪 开始测试邮件发送功能...\n')

  try {
    // 测试1: 检查Supabase连接
    console.log('1. 测试Supabase连接...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.log('❌ Supabase连接失败:', authError.message)
    } else {
      console.log('✅ Supabase连接成功')
    }

    // 测试2: 测试邮件发送功能
    console.log('\n2. 测试邮件发送功能...')
    
    const testEmail = 'test@example.com'
    
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: testEmail
    })

    if (error) {
      console.log('❌ 邮件发送失败:', error.message)
      console.log('💡 可能的原因:')
      console.log('   - Supabase邮箱验证功能未启用')
      console.log('   - SMTP服务未配置')
      console.log('   - 邮箱地址无效')
      console.log('\n🔧 解决方案:')
      console.log('   1. 登录Supabase控制台: https://supabase.com/dashboard')
      console.log('   2. 进入 Authentication > Settings')
      console.log('   3. 检查 "Enable email confirmations" 是否开启')
      console.log('   4. 配置SMTP服务或使用Supabase默认邮件服务')
    } else {
      console.log('✅ 邮件发送成功!')
      console.log('📧 邮件已发送到:', testEmail)
    }

    // 测试3: 检查邮箱验证配置
    console.log('\n3. 检查邮箱验证配置...')
    
    // 模拟注册流程
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'testpassword123'
    })

    if (signUpError) {
      console.log('❌ 注册测试失败:', signUpError.message)
    } else {
      console.log('✅ 注册测试成功')
      console.log('📧 用户邮箱:', signUpData.user?.email)
      console.log('🔐 邮箱验证状态:', signUpData.user?.email_confirmed_at ? '已验证' : '未验证')
      
      if (signUpData.session) {
        console.log('🔑 自动登录:', '是')
      } else {
        console.log('🔑 需要邮箱验证:', '是')
      }
    }

  } catch (error) {
    console.error('💥 测试过程中发生错误:', error)
  }

  console.log('\n📋 测试完成总结:')
  console.log('   在开发环境中，邮件发送功能会模拟成功')
  console.log('   在生产环境中，需要配置真实的邮件服务')
  console.log('   当前系统会在控制台显示邮件发送日志')
}

// 运行测试
testEmailSending()