/**
 * 登录问题诊断工具
 * 用于检测和解决账号登录问题
 */

import { supabase } from '@/lib/supabase'

export interface LoginDiagnosticResult {
  status: 'success' | 'warning' | 'error'
  message: string
  details: string[]
  suggestions: string[]
}

export class LoginDiagnostic {
  
  /**
   * 执行完整登录诊断
   */
  static async diagnoseLoginIssue(email: string, password: string): Promise<LoginDiagnosticResult> {
    const results: LoginDiagnosticResult = {
      status: 'success',
      message: '',
      details: [],
      suggestions: []
    }

    // 1. 检查环境配置
    const envCheck = await this.checkEnvironment()
    if (envCheck.status !== 'success') {
      return envCheck
    }

    // 2. 检查账号格式
    const formatCheck = this.checkEmailFormat(email)
    if (formatCheck.status !== 'success') {
      return formatCheck
    }

    // 3. 测试登录
    const loginTest = await this.testLogin(email, password)
    return loginTest
  }

  /**
   * 检查环境配置
   */
  private static async checkEnvironment(): Promise<LoginDiagnosticResult> {
    const result: LoginDiagnosticResult = {
      status: 'success',
      message: '环境配置正常',
      details: [],
      suggestions: []
    }

    // 检查Supabase配置
    if (!import.meta.env.VITE_SUPABASE_URL) {
      result.status = 'error'
      result.message = 'Supabase URL未配置'
      result.details.push('缺少VITE_SUPABASE_URL环境变量')
      result.suggestions.push('检查.env文件配置')
      result.suggestions.push('确认Supabase项目设置')
      return result
    }

    if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
      result.status = 'error'
      result.message = 'Supabase密钥未配置'
      result.details.push('缺少VITE_SUPABASE_ANON_KEY环境变量')
      result.suggestions.push('检查.env文件配置')
      result.suggestions.push('重新生成Supabase密钥')
      return result
    }

    // 测试数据库连接
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1)
      if (error) {
        result.status = 'error'
        result.message = '数据库连接失败'
        result.details.push(`连接错误: ${error.message}`)
        result.suggestions.push('检查网络连接')
        result.suggestions.push('验证Supabase服务状态')
        return result
      }
    } catch (error) {
      result.status = 'error'
      result.message = '数据库连接异常'
      result.details.push(`异常信息: ${error}`)
      result.suggestions.push('检查浏览器控制台错误')
      return result
    }

    result.details.push('Supabase配置正常')
    result.details.push('数据库连接成功')
    return result
  }

  /**
   * 检查邮箱格式
   */
  private static checkEmailFormat(email: string): LoginDiagnosticResult {
    const result: LoginDiagnosticResult = {
      status: 'success',
      message: '邮箱格式正确',
      details: [],
      suggestions: []
    }

    if (!email) {
      result.status = 'error'
      result.message = '邮箱不能为空'
      result.suggestions.push('请输入有效的邮箱地址')
      return result
    }

    if (!email.includes('@')) {
      result.status = 'warning'
      result.message = '邮箱格式可能不正确'
      result.details.push('检测到缺少@符号')
      result.suggestions.push('企业账号请使用完整邮箱格式: username@company.com')
      result.suggestions.push('学生账号可以使用学号或邮箱登录')
    }

    // 检查常见邮箱格式问题
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      result.status = 'warning'
      result.message = '邮箱格式不规范'
      result.details.push('邮箱格式不符合标准规范')
      result.suggestions.push('请检查邮箱格式是否正确')
      result.suggestions.push('示例: user@example.com')
    }

    return result
  }

  /**
   * 测试登录
   */
  private static async testLogin(email: string, password: string): Promise<LoginDiagnosticResult> {
    const result: LoginDiagnosticResult = {
      status: 'success',
      message: '登录测试通过',
      details: [],
      suggestions: []
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        result.status = 'error'
        result.message = this.getErrorMessage(error)
        result.details.push(`错误代码: ${error.status}`)
        result.details.push(`错误信息: ${error.message}`)
        result.suggestions = this.getErrorSuggestions(error)
        return result
      }

      if (data.user) {
        result.details.push('用户认证成功')
        result.details.push(`用户ID: ${data.user.id}`)
        result.details.push(`用户角色: ${data.user.user_metadata?.role || '未设置'}`)
        
        // 登出测试用户
        await supabase.auth.signOut()
      }

    } catch (error: any) {
      result.status = 'error'
      result.message = '登录过程异常'
      result.details.push(`异常信息: ${error.message}`)
      result.suggestions.push('请检查网络连接')
      result.suggestions.push('尝试刷新页面后重试')
    }

    return result
  }

  /**
   * 获取错误消息
   */
  private static getErrorMessage(error: any): string {
    const message = error.message.toLowerCase()
    
    if (message.includes('invalid login credentials')) {
      return '账号或密码错误'
    }
    if (message.includes('email not confirmed')) {
      return '邮箱未验证'
    }
    if (message.includes('user not found')) {
      return '账号不存在'
    }
    if (message.includes('too many requests')) {
      return '登录尝试过于频繁'
    }
    
    return '登录失败，请检查账号信息'
  }

  /**
   * 获取错误建议
   */
  private static getErrorSuggestions(error: any): string[] {
    const message = error.message.toLowerCase()
    const suggestions: string[] = []

    if (message.includes('invalid login credentials')) {
      suggestions.push('检查邮箱和密码是否正确')
      suggestions.push('尝试重置密码')
      suggestions.push('确认账号类型（学生/企业）')
    }
    if (message.includes('email not confirmed')) {
      suggestions.push('请先验证邮箱地址')
      suggestions.push('检查邮箱垃圾邮件文件夹')
      suggestions.push('重新发送验证邮件')
    }
    if (message.includes('user not found')) {
      suggestions.push('请先注册账号')
      suggestions.push('检查邮箱地址是否正确')
      suggestions.push('确认账号类型')
    }
    if (message.includes('too many requests')) {
      suggestions.push('请等待5分钟后重试')
      suggestions.push('清除浏览器缓存')
    }

    if (suggestions.length === 0) {
      suggestions.push('清除浏览器缓存后重试')
      suggestions.push('检查网络连接')
      suggestions.push('联系技术支持')
    }

    return suggestions
  }

  /**
   * 快速诊断当前登录状态
   */
  static async quickDiagnose(): Promise<LoginDiagnosticResult> {
    const result: LoginDiagnosticResult = {
      status: 'success',
      message: '系统状态正常',
      details: [],
      suggestions: []
    }

    // 检查当前会话
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      result.details.push(`当前用户: ${session.user.email}`)
      result.details.push(`登录状态: 已登录`)
      result.suggestions.push('如需重新登录，请先登出当前账号')
    } else {
      result.details.push('登录状态: 未登录')
      result.suggestions.push('请输入账号密码登录')
    }

    return result
  }
}

export default LoginDiagnostic