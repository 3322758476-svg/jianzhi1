// 简化的数据库连接测试脚本 (ES Module)
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env' })

console.log('🔗 开始数据库连接测试...\n')

// 检查环境变量
console.log('📋 检查环境变量:')
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ 已设置' : '❌ 未设置')
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ 已设置' : '❌ 未设置')

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.log('\n❌ 环境变量未正确设置，请检查 .env 文件')
  process.exit(1)
}

console.log('\n✅ 环境变量检查通过')

// 测试Supabase连接
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testConnection() {
  console.log('\n🔐 测试Supabase认证连接...')
  
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log('❌ 认证连接失败:', sessionError.message)
      return false
    }
    
    console.log('✅ 认证连接正常')
    console.log('   当前会话:', sessionData.session ? '有活跃会话' : '无活跃会话')
    
    return true
  } catch (error) {
    console.log('❌ 认证连接异常:', error.message)
    return false
  }
}

async function testDatabaseTables() {
  console.log('\n📊 测试数据库表访问...')
  
  const tables = ['companies', 'students', 'jobs', 'applications']
  let successCount = 0
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1)
      
      if (error) {
        console.log(`   ${table}: ❌ ${error.message}`)
      } else {
        console.log(`   ${table}: ✅ 可访问`)
        successCount++
      }
    } catch (error) {
      console.log(`   ${table}: ❌ ${error.message}`)
    }
  }
  
  console.log(`\n📈 表访问统计: ${successCount}/${tables.length} 个表可访问`)
  return successCount === tables.length
}

async function testCompanyFeatures() {
  console.log('\n🏢 测试企业相关功能...')
  
  try {
    // 测试企业表
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('count')
      .limit(1)
    
    if (companiesError) {
      console.log('❌ 企业表访问失败:', companiesError.message)
    } else {
      console.log('✅ 企业表可访问')
    }
    
    // 测试岗位表
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('count')
      .limit(1)
    
    if (jobsError) {
      console.log('❌ 岗位表访问失败:', jobsError.message)
    } else {
      console.log('✅ 岗位表可访问')
    }
    
    return !companiesError && !jobsError
  } catch (error) {
    console.log('❌ 企业功能测试异常:', error.message)
    return false
  }
}

async function runAllTests() {
  console.log('🚀 开始完整数据库连接测试\n')
  
  const results = await Promise.all([
    testConnection(),
    testDatabaseTables(),
    testCompanyFeatures()
  ])
  
  const successCount = results.filter(r => r).length
  const totalTests = results.length
  
  console.log('\n📋 测试结果汇总:')
  console.log(`   认证连接: ${results[0] ? '✅ 通过' : '❌ 失败'}`)
  console.log(`   表访问: ${results[1] ? '✅ 通过' : '❌ 失败'}`)
  console.log(`   企业功能: ${results[2] ? '✅ 通过' : '❌ 失败'}`)
  
  console.log(`\n📊 总体结果: ${successCount}/${totalTests} 项测试通过`)
  
  if (successCount === totalTests) {
    console.log('\n🎉 所有测试通过！数据库连接正常')
    console.log('💡 企业账号登录问题可能源于：')
    console.log('   1. 企业账号未注册')
    console.log('   2. 邮箱或密码错误')
    console.log('   3. 企业信息未完善')
  } else {
    console.log('\n⚠️ 部分测试失败，请检查：')
    console.log('   1. Supabase项目状态')
    console.log('   2. 数据库迁移是否执行')
    console.log('   3. 网络连接')
  }
  
  return successCount === totalTests
}

// 运行测试
runAllTests().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('测试执行异常:', error)
  process.exit(1)
})