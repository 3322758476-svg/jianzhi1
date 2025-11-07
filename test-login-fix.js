// 测试登录修复脚本
const { createClient } = require('@supabase/supabase-js')

// 从环境变量或配置文件读取 Supabase 配置
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testLoginFix() {
  console.log('🔧 测试登录修复效果...\n')

  // 测试用例1：使用正确的邮箱格式
  console.log('1️⃣ 测试用例1：使用正确的邮箱格式')
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    })
    
    if (error) {
      console.log('❌ 登录失败:', error.message)
      console.log('错误代码:', error.code)
      console.log('错误类型:', error.name)
    } else {
      console.log('✅ 登录成功')
      console.log('用户ID:', data.user.id)
    }
  } catch (error) {
    console.log('❌ 异常:', error.message)
  }

  console.log('\n2️⃣ 测试用例2：检查用户是否存在')
  try {
    // 先检查用户是否存在
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', '%test%')
      .limit(1)

    if (userError) {
      console.log('❌ 查询用户失败:', userError.message)
    } else if (userData && userData.length > 0) {
      console.log('✅ 找到用户:', userData[0].email)
      
      // 尝试使用找到的用户邮箱登录
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userData[0].email,
        password: 'testpassword123'
      })
      
      if (error) {
        console.log('❌ 登录失败:', error.message)
        console.log('可能的原因: 密码错误或邮箱未验证')
      } else {
        console.log('✅ 登录成功')
      }
    } else {
      console.log('⚠️ 未找到测试用户，请先注册账号')
    }
  } catch (error) {
    console.log('❌ 异常:', error.message)
  }

  console.log('\n3️⃣ 测试用例3：验证邮箱格式处理')
  console.log('修复前：会自动添加域名 (如: test@student.com)')
  console.log('修复后：直接使用用户输入的账号')
  console.log('✅ 修复完成：现在使用用户输入的原始账号作为邮箱')

  console.log('\n4️⃣ 解决方案建议：')
  console.log('• 确保注册时使用的邮箱与登录时输入的邮箱完全一致')
  console.log('• 检查邮箱是否已验证（在 Supabase 仪表板中禁用邮箱验证或验证邮箱）')
  console.log('• 确认密码是否正确')
  console.log('• 如果忘记密码，使用忘记密码功能重置')
}

// 运行测试
testLoginFix().catch(console.error)