// 详细诊断登录问题脚本
const { createClient } = require('@supabase/supabase-js')

// 从环境变量读取配置
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

console.log('🔧 开始详细诊断登录问题...\n')
console.log('Supabase URL:', supabaseUrl ? '已配置' : '未配置')
console.log('Supabase Key:', supabaseKey ? '已配置' : '未配置')

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseLoginIssue() {
  console.log('1️⃣ 检查Supabase连接...')
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    if (error) {
      console.log('❌ Supabase连接失败:', error.message)
      console.log('请检查:')
      console.log('• Supabase URL是否正确')
      console.log('• API Key是否有权限')
      console.log('• 网络连接是否正常')
      return
    }
    console.log('✅ Supabase连接正常')
  } catch (error) {
    console.log('❌ 连接异常:', error.message)
    return
  }

  console.log('\n2️⃣ 测试用户注册和登录流程...')
  
  // 测试用户数据
  const testUser = {
    email: 'test.student@example.com',
    password: 'TestPassword123!',
    username: 'teststudent'
  }

  console.log('测试用户:', testUser.email)

  // 步骤1: 尝试注册
  console.log('\n📝 步骤1: 注册测试用户...')
  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          username: testUser.username,
          role: 'student'
        }
      }
    })

    if (signUpError) {
      console.log('❌ 注册失败:', signUpError.message)
      console.log('错误代码:', signUpError.code)
      
      if (signUpError.message.includes('already registered')) {
        console.log('⚠️ 用户已存在，尝试直接登录...')
      } else {
        return
      }
    } else {
      console.log('✅ 注册成功')
      console.log('用户ID:', signUpData.user.id)
      console.log('是否需要邮箱验证:', !signUpData.session)
      
      if (signUpData.session) {
        console.log('🎉 注册时自动登录成功!')
        console.log('Session Token:', signUpData.session.access_token.substring(0, 20) + '...')
        return
      }
    }
  } catch (error) {
    console.log('❌ 注册异常:', error.message)
    return
  }

  // 步骤2: 尝试登录
  console.log('\n🔐 步骤2: 登录测试...')
  try {
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    })

    if (loginError) {
      console.log('❌ 登录失败:', loginError.message)
      console.log('错误名称:', loginError.name)
      console.log('错误代码:', loginError.code)
      console.log('完整错误对象:', JSON.stringify(loginError, null, 2))
      
      // 分析具体原因
      if (loginError.message.includes('Invalid login credentials')) {
        console.log('\n🔍 原因分析:')
        console.log('• 邮箱和密码不匹配')
        console.log('• 用户可能不存在')
        console.log('• 邮箱未验证（如果启用了邮箱验证）')
        
        console.log('\n💡 解决方案:')
        console.log('1. 检查邮箱是否正确')
        console.log('2. 检查密码是否正确')
        console.log('3. 在Supabase仪表板中禁用邮箱验证')
        console.log('4. 或验证邮箱地址')
      }
    } else {
      console.log('✅ 登录成功!')
      console.log('用户ID:', loginData.user.id)
      console.log('邮箱:', loginData.user.email)
      console.log('Session Token:', loginData.session.access_token.substring(0, 20) + '...')
    }
  } catch (error) {
    console.log('❌ 登录异常:', error.message)
  }

  // 步骤3: 检查用户表数据
  console.log('\n📊 步骤3: 检查数据库状态...')
  try {
    // 检查auth.users表（通过RPC函数）
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('email, created_at, confirmed_at')
      .ilike('email', `%${testUser.email}%`)
      .limit(5)

    if (authError) {
      console.log('⚠️ 无法直接查询auth.users表（权限限制）')
    } else if (authUsers && authUsers.length > 0) {
      console.log('🔍 找到认证用户:')
      authUsers.forEach(user => {
        console.log(`• ${user.email} - 创建时间: ${user.created_at} - 验证时间: ${user.confirmed_at || '未验证'}`)
      })
    }

    // 检查profiles表
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)

    if (profilesError) {
      console.log('❌ 查询profiles表失败:', profilesError.message)
    } else {
      console.log(`📋 profiles表中有 ${profiles.length} 条记录`)
      if (profiles.length > 0) {
        console.log('示例记录:', profiles[0])
      }
    }
  } catch (error) {
    console.log('❌ 数据库检查异常:', error.message)
  }

  console.log('\n🎯 最终建议:')
  console.log('1. 确保注册和登录使用相同的邮箱地址')
  console.log('2. 在Supabase仪表板的 Authentication → Settings 中:')
  console.log('   • 禁用 "Enable email confirmations"（测试环境）')
  console.log('   • 或确保邮箱已验证')
  console.log('3. 检查密码是否正确')
  console.log('4. 确认Supabase项目配置正确')
}

// 运行诊断
diagnoseLoginIssue().catch(console.error)