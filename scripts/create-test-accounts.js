// 测试账号创建脚本
// 用于在 Supabase 中创建测试账号

import { createClient } from '@supabase/supabase-js'

// Supabase 配置
const supabaseUrl = 'https://wptvwhlazelotraoagwt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwdHZ3aGxhemVsb3RyYW9hZ3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAzODQ0MDcsImV4cCI6MjA0NTk2MDQwN30.0Yz7v7j7p7p7p7p7p7p7p7p7p7p7p7p7p7p7p7p7p7p7p7'

const supabase = createClient(supabaseUrl, supabaseKey)

// 测试账号配置
const testAccounts = [
  {
    email: 'student@test.com',
    password: '123456',
    role: 'student',
    profile: {
      name: '测试学生',
      phone: '13800138000',
      university: '测试大学',
      major: '计算机科学',
      grade: '大三'
    }
  },
  {
    email: 'company@test.com',
    password: '123456',
    role: 'company',
    profile: {
      name: '测试企业',
      phone: '13800138001',
      company_name: '测试科技有限公司',
      industry: '互联网',
      scale: '50-100人'
    }
  },
  {
    email: 'admin@test.com',
    password: '123456',
    role: 'admin',
    profile: {
      name: '系统管理员',
      phone: '13800138002'
    }
  }
]

async function createTestAccounts() {
  console.log('🚀 开始创建测试账号...')
  
  for (const account of testAccounts) {
    try {
      console.log(`📝 创建账号: ${account.email}`)
      
      // 1. 创建认证用户
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true // 自动确认邮箱
      })
      
      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`⚠️ 账号 ${account.email} 已存在，跳过创建`)
          continue
        }
        throw authError
      }
      
      console.log(`✅ 认证用户创建成功: ${account.email}`)
      
      // 2. 创建用户资料
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: account.email,
          role: account.role,
          ...account.profile,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (profileError) {
        console.error(`❌ 创建用户资料失败:`, profileError)
        continue
      }
      
      console.log(`✅ 用户资料创建成功: ${account.email}`)
      
      // 3. 根据角色创建相关数据
      if (account.role === 'company') {
        // 创建企业数据
        const { error: companyError } = await supabase
          .from('companies')
          .insert({
            id: authData.user.id,
            name: account.profile.company_name,
            industry: account.profile.industry,
            scale: account.profile.scale,
            contact_phone: account.profile.phone,
            created_at: new Date().toISOString()
          })
        
        if (companyError) {
          console.error(`❌ 创建企业数据失败:`, companyError)
        } else {
          console.log(`✅ 企业数据创建成功: ${account.email}`)
        }
      }
      
      if (account.role === 'student') {
        // 创建学生简历数据
        const { error: resumeError } = await supabase
          .from('resumes')
          .insert({
            user_id: authData.user.id,
            name: account.profile.name,
            phone: account.profile.phone,
            email: account.email,
            school: account.profile.university,
            major: account.profile.major,
            education: '本科',
            skills: 'JavaScript, Vue.js, Node.js',
            languages: '英语四级',
            created_at: new Date().toISOString()
          })
        
        if (resumeError) {
          console.error(`❌ 创建简历数据失败:`, resumeError)
        } else {
          console.log(`✅ 简历数据创建成功: ${account.email}`)
        }
      }
      
      console.log(`🎉 账号 ${account.email} 创建完成`)
      
    } catch (error) {
      console.error(`❌ 创建账号 ${account.email} 失败:`, error)
    }
  }
  
  console.log('\n📋 测试账号信息:')
  console.log('学生账号: student@test.com / 123456')
  console.log('企业账号: company@test.com / 123456')
  console.log('管理员账号: admin@test.com / 123456')
  console.log('\n💡 提示: 请确保已执行数据库迁移脚本')
}

// 运行脚本
createTestAccounts().catch(console.error)