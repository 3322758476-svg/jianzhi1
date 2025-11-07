// 简化的测试账号创建脚本
// 使用 Supabase 管理 API 创建测试账号

const { createClient } = require('@supabase/supabase-js')

// Supabase 配置
const supabaseUrl = 'https://wptvwhlazelotraoagwt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwdHZ3aGxhemVsb3RyYW9hZ3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAzODQ0MDcsImV4cCI6MjA0NTk2MDQwN30.0Yz7v7j7p7p7p7p7p7p7p7p7p7p7p7p7p7p7p7p7p7p7p7'

const supabase = createClient(supabaseUrl, supabaseKey)

// 测试账号信息
const testAccounts = [
  {
    email: 'student@test.com',
    password: '123456',
    role: 'student',
    name: '测试学生'
  },
  {
    email: 'company@test.com',
    password: '123456',
    role: 'company',
    name: '测试企业'
  }
]

async function createTestAccounts() {
  console.log('🚀 开始创建测试账号...')
  
  for (const account of testAccounts) {
    try {
      console.log(`📝 尝试创建账号: ${account.email}`)
      
      // 使用 signUp 方法创建用户
      const { data, error } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: {
          data: {
            name: account.name,
            role: account.role
          }
        }
      })
      
      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`⚠️ 账号 ${account.email} 已存在`)
        } else {
          console.error(`❌ 创建账号 ${account.email} 失败:`, error.message)
        }
      } else {
        console.log(`✅ 账号 ${account.email} 创建成功`)
        console.log(`   用户ID: ${data.user?.id}`)
        console.log(`   需要邮箱确认: ${!data.session}`)
      }
      
    } catch (error) {
      console.error(`❌ 创建账号 ${account.email} 时发生错误:`, error)
    }
  }
  
  console.log('\n📋 测试账号信息:')
  console.log('学生账号: student@test.com / 123456')
  console.log('企业账号: company@test.com / 123456')
  console.log('\n💡 提示:')
  console.log('1. 如果账号需要邮箱确认，请检查邮箱并点击确认链接')
  console.log('2. 或者使用 Supabase Dashboard 手动确认邮箱')
  console.log('3. 确认后即可正常登录')
}

// 运行脚本
createTestAccounts().catch(console.error)