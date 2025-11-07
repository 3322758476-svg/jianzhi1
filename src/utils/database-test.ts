// 加载环境变量
import { config } from 'dotenv'
config({ path: '.env' })

import { supabase } from '@/lib/supabase'

/**
 * 数据库连接测试工具
 * 用于检测Supabase连接状态和系统健康度
 */

export interface DatabaseTestResult {
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
  timestamp: string
}

export interface ConnectionStatus {
  supabase: boolean
  auth: boolean
  database: boolean
  tables: boolean
}

/**
 * 测试Supabase基础连接
 */
export async function testSupabaseConnection(): Promise<DatabaseTestResult> {
  try {
    console.log('🔗 测试Supabase连接...')
    
    // 测试基础连接
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return {
        status: 'error',
        message: `Supabase认证连接失败: ${sessionError.message}`,
        timestamp: new Date().toISOString()
      }
    }
    
    console.log('✅ Supabase基础连接正常')
    
    return {
      status: 'success',
      message: 'Supabase连接正常',
      details: {
        hasSession: !!sessionData.session,
        user: sessionData.session?.user?.email
      },
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    return {
      status: 'error',
      message: `Supabase连接异常: ${error.message}`,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * 测试数据库表访问
 */
export async function testDatabaseTables(): Promise<DatabaseTestResult> {
  try {
    console.log('📊 测试数据库表访问...')
    
    // 测试核心业务表访问
    const tablesToTest = ['companies', 'students', 'jobs', 'applications']
    const testResults = []
    
    for (const tableName of tablesToTest) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1)
        
        testResults.push({
          table: tableName,
          accessible: !error,
          error: error?.message
        })
        
        if (!error) {
          console.log(`✅ 表 ${tableName} 可访问`)
        } else {
          console.log(`⚠️ 表 ${tableName} 访问失败:`, error.message)
        }
      } catch (error: any) {
        testResults.push({
          table: tableName,
          accessible: false,
          error: error.message
        })
        console.log(`❌ 表 ${tableName} 访问异常:`, error.message)
      }
    }
    
    const accessibleTables = testResults.filter(r => r.accessible).length
    const totalTables = tablesToTest.length
    
    if (accessibleTables === totalTables) {
      return {
        status: 'success',
        message: `所有核心业务表均可访问 (${accessibleTables}/${totalTables})`,
        details: testResults,
        timestamp: new Date().toISOString()
      }
    } else if (accessibleTables > 0) {
      return {
        status: 'warning',
        message: `部分业务表可访问 (${accessibleTables}/${totalTables})`,
        details: testResults,
        timestamp: new Date().toISOString()
      }
    } else {
      return {
        status: 'error',
        message: `所有业务表访问失败 (0/${totalTables})`,
        details: testResults,
        timestamp: new Date().toISOString()
      }
    }
  } catch (error: any) {
    return {
      status: 'error',
      message: `数据库表测试异常: ${error.message}`,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * 测试企业账号相关功能
 */
export async function testCompanyFeatures(): Promise<DatabaseTestResult> {
  try {
    console.log('🏢 测试企业账号功能...')
    
    // 测试企业表访问
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('count')
      .limit(1)
    
    // 测试岗位表访问
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('count')
      .limit(1)
    
    const companyAccessible = !companiesError
    const jobsAccessible = !jobsError
    
    if (companyAccessible && jobsAccessible) {
      return {
        status: 'success',
        message: '企业相关功能正常',
        details: {
          companies: companies?.length || 0,
          jobs: jobs?.length || 0,
          companyTable: companyAccessible,
          jobsTable: jobsAccessible
        },
        timestamp: new Date().toISOString()
      }
    } else {
      return {
        status: 'warning',
        message: '企业相关功能部分可用',
        details: {
          companyTable: companyAccessible,
          jobsTable: jobsAccessible,
          errors: {
            companies: companiesError?.message,
            jobs: jobsError?.message
          }
        },
        timestamp: new Date().toISOString()
      }
    }
  } catch (error: any) {
    return {
      status: 'error',
      message: `企业功能测试异常: ${error.message}`,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * 完整数据库连接测试
 */
export async function runFullDatabaseTest(): Promise<{
  overallStatus: 'success' | 'error' | 'warning'
  results: DatabaseTestResult[]
  connectionStatus: ConnectionStatus
}> {
  console.log('🚀 开始完整数据库连接测试...')
  
  const results = await Promise.all([
    testSupabaseConnection(),
    testDatabaseTables(),
    testCompanyFeatures()
  ])
  
  // 计算总体状态
  const errorCount = results.filter(r => r.status === 'error').length
  const warningCount = results.filter(r => r.status === 'warning').length
  
  let overallStatus: 'success' | 'error' | 'warning' = 'success'
  if (errorCount > 0) {
    overallStatus = 'error'
  } else if (warningCount > 0) {
    overallStatus = 'warning'
  }
  
  // 构建连接状态
  const connectionStatus: ConnectionStatus = {
    supabase: results[0].status !== 'error',
    auth: results[0].status !== 'error',
    database: results[1].status !== 'error',
    tables: results[1].status === 'success'
  }
  
  console.log('📋 测试完成:', {
    overallStatus,
    connectionStatus,
    results: results.map(r => ({ status: r.status, message: r.message }))
  })
  
  return {
    overallStatus,
    results,
    connectionStatus
  }
}

/**
 * 企业账号登录诊断
 */
export async function diagnoseCompanyLogin(email?: string): Promise<{
  status: 'ready' | 'issues' | 'error'
  issues: string[]
  suggestions: string[]
  connectionStatus: ConnectionStatus
}> {
  console.log('🔍 诊断企业账号登录问题...')
  
  const { overallStatus, results, connectionStatus } = await runFullDatabaseTest()
  
  const issues: string[] = []
  const suggestions: string[] = []
  
  // 分析连接问题
  if (!connectionStatus.supabase) {
    issues.push('Supabase连接失败')
    suggestions.push('检查环境变量 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY')
  }
  
  if (!connectionStatus.database) {
    issues.push('数据库连接异常')
    suggestions.push('检查Supabase项目状态和网络连接')
  }
  
  if (!connectionStatus.tables) {
    issues.push('业务表访问受限')
    suggestions.push('检查数据库迁移是否已执行，表结构是否正确')
  }
  
  // 检查企业相关功能
  const companyTest = results.find(r => 
    r.message.includes('企业') || r.message.includes('company')
  )
  
  if (companyTest && companyTest.status !== 'success') {
    issues.push('企业功能异常')
    suggestions.push('检查 companies 和 jobs 表是否存在且可访问')
  }
  
  // 提供具体建议
  if (issues.length === 0) {
    suggestions.push(
      '数据库连接正常，请检查：',
      '1. 企业账号是否已注册',
      '2. 邮箱和密码是否正确',
      '3. 浏览器控制台是否有详细错误信息'
    )
  }
  
  return {
    status: issues.length === 0 ? 'ready' : overallStatus === 'error' ? 'error' : 'issues',
    issues,
    suggestions,
    connectionStatus
  }
}

/**
 * 在控制台运行测试（开发使用）
 */
export async function runConsoleTest() {
  console.log('🧪 运行数据库连接测试...\n')
  
  const { overallStatus, results, connectionStatus } = await runFullDatabaseTest()
  
  console.log('\n📊 测试结果汇总:')
  console.log(`总体状态: ${overallStatus}`)
  console.log('连接状态:', connectionStatus)
  
  console.log('\n📋 详细结果:')
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.message}`)
    console.log(`   状态: ${result.status}`)
    if (result.details) {
      console.log(`   详情:`, JSON.stringify(result.details, null, 2))
    }
  })
  
  console.log('\n💡 建议:')
  const diagnosis = await diagnoseCompanyLogin()
  diagnosis.suggestions.forEach(suggestion => {
    console.log(`   • ${suggestion}`)
  })
  
  return { overallStatus, connectionStatus }
}

// 导出为模块
if (import.meta.env?.DEV) {
  // 开发环境下自动运行测试
  setTimeout(() => {
    runConsoleTest().catch(console.error)
  }, 1000)
}