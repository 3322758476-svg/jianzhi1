// 增强的认证服务 - 集成安全验证功能

import { supabase } from '@/lib/supabase'
import { SecurityService, SecurityContext, ValidationRules } from './security'
import type { Database } from '@/lib/supabase'

type User = Database['public']['Tables']['profiles']['Row']

export interface EnhancedLoginCredentials {
  email: string
  password: string
  type: 'student' | 'company'
  ipAddress?: string
  userAgent?: string
}

export interface EnhancedRegisterData extends EnhancedLoginCredentials {
  username: string
  confirmPassword: string
  additionalData?: Record<string, any>
}

export interface EnhancedUserProfile {
  id: string
  email: string
  username: string
  role: 'student' | 'company' | 'admin'
  avatar_url?: string
  created_at: string
  security_level: 'low' | 'medium' | 'high'
  last_login?: string
  login_count: number
}

export interface LoginSecurityCheck {
  allowed: boolean
  reason?: string
  requires_2fa?: boolean
  risk_level: 'low' | 'medium' | 'high'
  recommendations?: string[]
}

export class EnhancedAuthService {
  // 增强的用户登录 - 包含安全验证
  static async login(
    credentials: EnhancedLoginCredentials
  ): Promise<{ 
    user: EnhancedUserProfile | null; 
    error: string | null; 
    securityCheck: LoginSecurityCheck 
  }> {
    try {
      // 1. 安全验证检查
      const securityCheck = await this.performSecurityCheck(credentials)
      
      if (!securityCheck.allowed) {
        return {
          user: null,
          error: securityCheck.reason || '登录被安全系统阻止',
          securityCheck
        }
      }

      // 2. 验证输入数据
      const validation = SecurityService.validateInput(credentials, [
        { field: 'email', type: 'email', required: true },
        { field: 'password', type: 'string', required: true, minLength: 6 },
        { field: 'type', type: 'string', required: true, enum: ['student', 'company'] }
      ])

      if (!validation.valid) {
        return {
          user: null,
          error: validation.errors.join(', '),
          securityCheck: { allowed: false, risk_level: 'high', reason: '输入验证失败' }
        }
      }

      // 3. 执行登录
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (error) {
        // 记录登录失败的安全事件
        await this.logSecurityEvent({
          type: 'login_failed',
          user_email: credentials.email,
          ip_address: credentials.ipAddress,
          user_agent: credentials.userAgent,
          reason: error.message
        })
        
        return {
          user: null,
          error: error.message,
          securityCheck: { allowed: false, risk_level: 'medium', reason: '认证失败' }
        }
      }

      if (!data.user) {
        return {
          user: null,
          error: '登录失败',
          securityCheck: { allowed: false, risk_level: 'high', reason: '用户不存在' }
        }
      }

      // 4. 获取用户详细信息
      const userProfile = await this.getEnhancedUserProfile(data.user.id)
      
      // 5. 记录成功登录的安全事件
      await this.logSecurityEvent({
        type: 'login_success',
        user_id: data.user.id,
        user_email: credentials.email,
        ip_address: credentials.ipAddress,
        user_agent: credentials.userAgent
      })

      // 6. 更新登录统计
      await this.updateLoginStats(data.user.id)

      return {
        user: userProfile,
        error: null,
        securityCheck: { allowed: true, risk_level: 'low' }
      }
    } catch (error: any) {
      return {
        user: null,
        error: error.message || '登录失败',
        securityCheck: { allowed: false, risk_level: 'high', reason: '系统错误' }
      }
    }
  }

  // 增强的用户注册 - 包含安全验证
  static async register(
    userData: EnhancedRegisterData
  ): Promise<{ 
    user: EnhancedUserProfile | null; 
    error: string | null; 
    securityCheck: LoginSecurityCheck 
  }> {
    try {
      // 1. 注册安全检查
      const securityCheck = await this.performRegistrationCheck(userData)
      
      if (!securityCheck.allowed) {
        return {
          user: null,
          error: securityCheck.reason || '注册被安全系统阻止',
          securityCheck
        }
      }

      // 2. 验证密码匹配
      if (userData.password !== userData.confirmPassword) {
        return {
          user: null,
          error: '密码不匹配',
          securityCheck: { allowed: false, risk_level: 'medium', reason: '密码验证失败' }
        }
      }

      // 3. 验证输入数据
      const validation = SecurityService.validateInput(userData, [
        { field: 'email', type: 'email', required: true },
        { field: 'password', type: 'string', required: true, minLength: 8 },
        { field: 'username', type: 'string', required: true, minLength: 2, maxLength: 50 },
        { field: 'type', type: 'string', required: true, enum: ['student', 'company'] }
      ])

      if (!validation.valid) {
        return {
          user: null,
          error: validation.errors.join(', '),
          securityCheck: { allowed: false, risk_level: 'high', reason: '输入验证失败' }
        }
      }

      // 4. 执行注册
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            username: userData.username,
            role: userData.type,
            security_level: 'medium'
          }
        }
      })

      if (error) {
        await this.logSecurityEvent({
          type: 'registration_failed',
          user_email: userData.email,
          ip_address: userData.ipAddress,
          reason: error.message
        })
        
        return {
          user: null,
          error: error.message,
          securityCheck: { allowed: false, risk_level: 'medium', reason: '注册失败' }
        }
      }

      if (!data.user) {
        return {
          user: null,
          error: '注册失败',
          securityCheck: { allowed: false, risk_level: 'high', reason: '用户创建失败' }
        }
      }

      // 5. 根据用户类型创建对应的资料
      if (userData.type === 'student') {
        await supabase.from('students').insert({
          user_id: data.user.id,
          real_name: userData.username,
          school: userData.additionalData?.school || '',
          major: userData.additionalData?.major || ''
        })
      } else if (userData.type === 'company') {
        await supabase.from('companies').insert({
          user_id: data.user.id,
          company_name: userData.username,
          contact_person: userData.additionalData?.contactPerson || '',
          contact_phone: userData.additionalData?.contactPhone || ''
        })
      }

      // 6. 获取用户详细信息
      const userProfile = await this.getEnhancedUserProfile(data.user.id)
      
      // 7. 记录注册成功的安全事件
      await this.logSecurityEvent({
        type: 'registration_success',
        user_id: data.user.id,
        user_email: userData.email,
        ip_address: userData.ipAddress
      })

      return {
        user: userProfile,
        error: null,
        securityCheck: { allowed: true, risk_level: 'low' }
      }
    } catch (error: any) {
      return {
        user: null,
        error: error.message || '注册失败',
        securityCheck: { allowed: false, risk_level: 'high', reason: '系统错误' }
      }
    }
  }

  // 安全验证检查
  private static async performSecurityCheck(credentials: EnhancedLoginCredentials): Promise<LoginSecurityCheck> {
    const checks: Array<{ check: () => Promise<boolean>; reason: string; risk: 'low' | 'medium' | 'high' }> = [
      {
        check: async () => {
          // 检查IP地址是否在黑名单
          const { data } = await supabase
            .from('security_blacklist')
            .select('id')
            .eq('type', 'ip')
            .eq('value', credentials.ipAddress)
            .single()
          return !data
        },
        reason: 'IP地址被列入黑名单',
        risk: 'high'
      },
      {
        check: async () => {
          // 检查登录频率
          const { count } = await supabase
            .from('audit_logs')
            .select('*', { count: 'exact' })
            .eq('action_type', 'login_failed')
            .eq('user_email', credentials.email)
            .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // 1小时内
          
          return (count || 0) < 5 // 1小时内失败次数不超过5次
        },
        reason: '登录尝试过于频繁',
        risk: 'medium'
      },
      {
        check: async () => {
          // 检查密码强度
          const passwordStrength = this.checkPasswordStrength(credentials.password)
          return passwordStrength.score >= 2 // 中等强度以上
        },
        reason: '密码强度不足',
        risk: 'medium'
      }
    ]

    const results = await Promise.all(checks.map(async (check) => {
      const passed = await check.check()
      return { passed, reason: check.reason, risk: check.risk }
    }))

    const failedChecks = results.filter(result => !result.passed)
    
    if (failedChecks.length > 0) {
      const highestRisk = failedChecks.reduce((max, check) => 
        this.getRiskLevelValue(check.risk) > this.getRiskLevelValue(max.risk) ? check : max
      )
      
      return {
        allowed: false,
        reason: highestRisk.reason,
        risk_level: highestRisk.risk,
        requires_2fa: highestRisk.risk === 'high'
      }
    }

    return { allowed: true, risk_level: 'low' }
  }

  // 注册安全检查
  private static async performRegistrationCheck(userData: EnhancedRegisterData): Promise<LoginSecurityCheck> {
    // 检查邮箱是否已被注册
    const { data: existingUser } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', userData.email)
      .single()

    if (existingUser) {
      return {
        allowed: false,
        reason: '该邮箱已被注册',
        risk_level: 'medium'
      }
    }

    // 检查用户名是否已被使用
    const { data: existingUsername } = await supabase
      .from('auth.users')
      .select('id')
      .eq('raw_user_meta_data->>username', userData.username)
      .single()

    if (existingUsername) {
      return {
        allowed: false,
        reason: '该用户名已被使用',
        risk_level: 'medium'
      }
    }

    return { allowed: true, risk_level: 'low' }
  }

  // 获取增强的用户资料
  private static async getEnhancedUserProfile(userId: string): Promise<EnhancedUserProfile> {
    // 使用 profiles 表获取用户信息，而不是 admin API
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (profileError || !profileData) {
      throw new Error('用户档案不存在')
    }

    // 获取用户基本信息
    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData?.session?.user
    
    if (!user) {
      throw new Error('用户会话不存在')
    }

    const userMetadata = user.user_metadata
    
    // 获取登录统计
    const { data: loginStats } = await supabase
      .from('user_login_stats')
      .select('login_count, last_login')
      .eq('user_id', userId)
      .single()

    return {
      id: user.id,
      email: user.email || '',
      username: userMetadata?.username || user.email?.split('@')[0] || '',
      role: userMetadata?.role || 'student',
      avatar_url: userMetadata?.avatar_url,
      created_at: user.created_at,
      security_level: userMetadata?.security_level || 'medium',
      last_login: loginStats?.last_login,
      login_count: loginStats?.login_count || 0
    }
  }

  // 更新登录统计
  private static async updateLoginStats(userId: string): Promise<void> {
    await supabase.rpc('update_user_login_stats', { user_id: userId })
  }

  // 记录安全事件
  private static async logSecurityEvent(event: {
    type: string
    user_id?: string
    user_email?: string
    ip_address?: string
    user_agent?: string
    reason?: string
  }): Promise<void> {
    await supabase.from('audit_logs').insert({
      user_id: event.user_id,
      action_type: event.type,
      table_name: 'auth',
      ip_address: event.ip_address,
      user_agent: event.user_agent,
      new_values: {
        user_email: event.user_email,
        reason: event.reason
      }
    })
  }

  // 检查密码强度
  private static checkPasswordStrength(password: string): { score: number; feedback: string[] } {
    const feedback: string[] = []
    let score = 0

    if (password.length >= 8) score++
    else feedback.push('密码长度至少8位')

    if (/[a-z]/.test(password)) score++
    else feedback.push('包含小写字母')

    if (/[A-Z]/.test(password)) score++
    else feedback.push('包含大写字母')

    if (/[0-9]/.test(password)) score++
    else feedback.push('包含数字')

    if (/[^a-zA-Z0-9]/.test(password)) score++
    else feedback.push('包含特殊字符')

    return { score, feedback }
  }

  // 获取风险等级数值
  private static getRiskLevelValue(risk: 'low' | 'medium' | 'high'): number {
    const values = { low: 1, medium: 2, high: 3 }
    return values[risk]
  }

  // 获取当前用户的安全状态
  static async getSecurityStatus(userId: string): Promise<{
    security_level: string
    last_login: string | null
    login_count: number
    risk_assessment: 'low' | 'medium' | 'high'
    recommendations: string[]
  }> {
    const profile = await this.getEnhancedUserProfile(userId)
    
    const recommendations: string[] = []
    let risk_assessment: 'low' | 'medium' | 'high' = 'low'

    if (profile.security_level === 'low') {
      recommendations.push('建议启用双重认证')
      recommendations.push('建议定期更换密码')
      risk_assessment = 'medium'
    }

    if (profile.login_count < 5) {
      recommendations.push('新用户，建议完善个人信息')
    }

    return {
      security_level: profile.security_level,
      last_login: profile.last_login || null,
      login_count: profile.login_count,
      risk_assessment,
      recommendations
    }
  }
}