/**
 * 登录诊断工具 - 帮助识别和解决登录异常问题
 */

import { supabase } from '@/lib/supabase'

export interface DiagnosticResult {
  status: 'success' | 'warning' | 'error'
  message: string
  details: {
    category: string
    description: string
    suggestion: string
  }[]
}

export class LoginDiagnosticTool {
  
  /**
   * 执行完整登录诊断
   */
  static async diagnoseLoginIssue(email: string, password: string): Promise<DiagnosticResult> {
    const results: DiagnosticResult = {
      status: 'success',
      message: '系统诊断完成',
      details: []
    }

    // 1. 检查环境配置
    const envCheck = await this.checkEnvironment()
    results.details.push(...envCheck.details)
    
    // 2. 检查网络连接
    const networkCheck = await this.checkNetwork()
    results.details.push(...networkCheck.details)
    
    // 3. 检查Supabase服务状态
    const supabaseCheck = await this.checkSupabaseStatus()
    results.details.push(...supabaseCheck.details)
    
    // 4. 检查账号格式
    const accountCheck = this.checkAccountFormat(email)
    results.details.push(...accountCheck.details)
    
    // 5. 测试登录
    const loginTest = await this.testLogin(email, password)
    results.details.push(...loginTest.details)
    
    // 确定总体状态
    const errorCount = results.details.filter(d => d.category === 'error').length
    const warningCount = results.details.filter(d => d.category === 'warning').length
    
    if (errorCount > 0) {
      results.status = 'error'
      results.message = `发现 ${errorCount} 个错误，${warningCount} 个警告`
    } else if (warningCount > 0) {
      results.status = 'warning'
      results.message = `发现 ${warningCount} 个警告`
    }
    
    return results
  }

  /**
   * 检查环境配置
   */
  private static async checkEnvironment(): Promise<DiagnosticResult> {
    const details: DiagnosticResult['details'] = []
    
    // 检查环境变量
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl) {
      details.push({
        category: 'error',
        description: 'Supabase URL未配置',
        suggestion: '检查.env文件中的VITE_SUPABASE_URL设置'
      })
    }
    
    if (!supabaseKey) {
      details.push({
        category: 'error',
        description: 'Supabase密钥未配置',
        suggestion: '检查.env文件中的VITE_SUPABASE_ANON_KEY设置'
      })
    }
    
    if (supabaseUrl && supabaseKey) {
      details.push({
        category: 'success',
        description: '环境变量配置正常',
        suggestion: '环境配置检查通过'
      })
    }
    
    return { status: 'success', message: '', details }
  }

  /**
   * 检查网络连接
   */
  private static async checkNetwork(): Promise<DiagnosticResult> {
    const details: DiagnosticResult['details'] = []
    
    try {
      // 测试网络连接
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
        mode: 'no-cors'
      }).catch(() => null)
      
      if (response) {
        details.push({
          category: 'success',
          description: '网络连接正常',
          suggestion: '网络连接检查通过'
        })
      } else {
        details.push({
          category: 'warning',
          description: '网络连接测试失败',
          suggestion: '检查网络连接或防火墙设置'
        })
      }
    } catch (error) {
      details.push({
        category: 'error',
        description: '网络连接异常',
        suggestion: '检查网络连接状态'
      })
    }
    
    return { status: 'success', message: '', details }
  }

  /**
   * 检查Supabase服务状态
   */
  private static async checkSupabaseStatus(): Promise<DiagnosticResult> {
    const details: DiagnosticResult['details'] = []
    
    try {
      // 测试Supabase连接
      const { data, error } = await supabase.from('profiles').select('count').limit(1)
      
      if (error) {
        details.push({
          category: 'error',
          description: `Supabase连接失败: ${error.message}`,
          suggestion: '检查Supabase项目状态和网络连接'
        })
      } else {
        details.push({
          category: 'success',
          description: 'Supabase连接正常',
          suggestion: '数据库服务检查通过'
        })
      }
    } catch (error: any) {
      details.push({
        category: 'error',
        description: `Supabase连接异常: ${error.message}`,
        suggestion: '检查Supabase服务状态和配置'
      })
    }
    
    return { status: 'success', message: '', details }
  }

  /**
   * 检查账号格式
   */
  private static checkAccountFormat(email: string): DiagnosticResult {
    const details: DiagnosticResult['details'] = []
    
    if (!email) {
      details.push({
        category: 'error',
        description: '邮箱地址为空',
        suggestion: '请输入有效的邮箱地址'
      })
    } else if (!email.includes('@')) {
      details.push({
        category: 'warning',
        description: '邮箱格式可能不正确',
        suggestion: '请使用完整邮箱格式: username@example.com'
      })
    } else {
      details.push({
        category: 'success',
        description: '邮箱格式正确',
        suggestion: '账号格式检查通过'
      })
    }
    
    return { status: 'success', message: '', details }
  }

  /**
   * 测试登录
   */
  private static async testLogin(email: string, password: string): Promise<DiagnosticResult> {
    const details: DiagnosticResult['details'] = []
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        const errorType = this.getErrorType(error.message)
        details.push({
          category: 'error',
          description: `登录失败: ${error.message}`,
          suggestion: this.getErrorSuggestion(errorType)
        })
      } else if (data.user) {
        details.push({
          category: 'success',
          description: '登录测试成功',
          suggestion: '账号认证检查通过'
        })
        
        // 登出测试用户
        await supabase.auth.signOut()
      }
    } catch (error: any) {
      details.push({
        category: 'error',
        description: `登录过程异常: ${error.message}`,
        suggestion: '检查网络连接和浏览器设置'
      })
    }
    
    return { status: 'success', message: '', details }
  }

  /**
   * 获取错误类型
   */
  private static getErrorType(errorMessage: string): string {
    const message = errorMessage.toLowerCase()
    
    if (message.includes('invalid login credentials')) return 'invalid_credentials'
    if (message.includes('email not confirmed')) return 'email_not_confirmed'
    if (message.includes('user not found')) return 'user_not_found'
    if (message.includes('too many requests')) return 'too_many_requests'
    if (message.includes('network')) return 'network_error'
    if (message.includes('timeout')) return 'timeout'
    
    return 'unknown'
  }

  /**
   * 获取错误建议
   */
  private static getErrorSuggestion(errorType: string): string {
    const suggestions: Record<string, string> = {
      invalid_credentials: '检查邮箱和密码是否正确，确认大小写输入正确',
      email_not_confirmed: '请先验证邮箱地址，检查垃圾邮件文件夹',
      user_not_found: '账号不存在，请先注册或检查邮箱地址',
      too_many_requests: '登录尝试过于频繁，请等待5分钟后重试',
      network_error: '网络连接问题，请检查网络设置',
      timeout: '请求超时，请稍后重试',
      unknown: '未知错误，请清除浏览器缓存后重试'
    }
    
    return suggestions[errorType] || suggestions.unknown
  }

  /**
   * 快速诊断当前状态
   */
  static async quickDiagnose(): Promise<DiagnosticResult> {
    const details: DiagnosticResult['details'] = []
    
    // 检查当前会话状态
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      details.push({
        category: 'warning',
        description: `当前已有活跃会话: ${session.user.email}`,
        suggestion: '如需重新登录，请先登出当前账号'
      })
    } else {
      details.push({
        category: 'success',
        description: '当前无活跃会话',
        suggestion: '可以正常进行登录操作'
      })
    }
    
    return { status: 'success', message: '快速诊断完成', details }
  }

  /**
   * 生成诊断报告
   */
  static generateReport(result: DiagnosticResult): string {
    let report = `# 登录诊断报告\n\n`
    report += `**总体状态**: ${result.status === 'success' ? '✅ 正常' : result.status === 'warning' ? '⚠️ 警告' : '❌ 错误'}\n`
    report += `**诊断结果**: ${result.message}\n\n`
    
    report += `## 详细诊断信息\n\n`
    
    result.details.forEach((detail, index) => {
      const icon = detail.category === 'success' ? '✅' : detail.category === 'warning' ? '⚠️' : '❌'
      report += `${index + 1}. ${icon} **${detail.description}**\n`
      report += `   💡 ${detail.suggestion}\n\n`
    })
    
    return report
  }
}

export default LoginDiagnosticTool