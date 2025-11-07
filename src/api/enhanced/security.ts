// 安全验证和权限控制模块

import { supabase } from '@/lib/supabase'

export interface SecurityContext {
  userId: string
  userRole: 'student' | 'company' | 'admin'
  ipAddress?: string
  userAgent?: string
}

export class SecurityService {
  // 验证用户权限
  static async validatePermission(
    context: SecurityContext, 
    resourceType: string, 
    action: 'read' | 'write' | 'delete',
    resourceId?: string
  ): Promise<{ allowed: boolean; error?: string }> {
    try {
      // 管理员拥有所有权限
      if (context.userRole === 'admin') {
        return { allowed: true }
      }

      // 根据资源类型和操作进行权限验证
      switch (resourceType) {
        case 'job':
          return await this.validateJobPermission(context, action, resourceId)
        case 'application':
          return await this.validateApplicationPermission(context, action, resourceId)
        case 'message':
          return await this.validateMessagePermission(context, action, resourceId)
        case 'review':
          return await this.validateReviewPermission(context, action, resourceId)
        default:
          return { allowed: false, error: '未知的资源类型' }
      }
    } catch (error: any) {
      return { allowed: false, error: error.message }
    }
  }

  // 验证岗位权限
  private static async validateJobPermission(
    context: SecurityContext, 
    action: string, 
    jobId?: string
  ): Promise<{ allowed: boolean; error?: string }> {
    if (!jobId) {
      // 创建岗位需要企业权限
      return { allowed: context.userRole === 'company' }
    }

    // 检查用户是否拥有该岗位的权限
    const { data: job, error } = await supabase
      .from('jobs')
      .select('company_id')
      .eq('id', jobId)
      .single()

    if (error) {
      return { allowed: false, error: '岗位不存在' }
    }

    // 检查用户是否是该企业的所有者
    const { data: company } = await supabase
      .from('companies')
      .select('user_id')
      .eq('id', job.company_id)
      .single()

    return { allowed: company?.user_id === context.userId }
  }

  // 验证申请权限
  private static async validateApplicationPermission(
    context: SecurityContext, 
    action: string, 
    applicationId?: string
  ): Promise<{ allowed: boolean; error?: string }> {
    if (!applicationId) {
      // 创建申请需要学生权限
      return { allowed: context.userRole === 'student' }
    }

    const { data: application, error } = await supabase
      .from('applications')
      .select('student_id, job_id')
      .eq('id', applicationId)
      .single()

    if (error) {
      return { allowed: false, error: '申请记录不存在' }
    }

    if (context.userRole === 'student') {
      // 学生只能操作自己的申请
      const { data: student } = await supabase
        .from('students')
        .select('user_id')
        .eq('id', application.student_id)
        .single()

      return { allowed: student?.user_id === context.userId }
    } else if (context.userRole === 'company') {
      // 企业只能查看自己岗位的申请
      const { data: job } = await supabase
        .from('jobs')
        .select('company_id')
        .eq('id', application.job_id)
        .single()

      const { data: company } = await supabase
        .from('companies')
        .select('user_id')
        .eq('id', job.company_id)
        .single()

      return { allowed: company?.user_id === context.userId }
    }

    return { allowed: false }
  }

  // 验证消息权限
  private static async validateMessagePermission(
    context: SecurityContext, 
    action: string, 
    messageId?: string
  ): Promise<{ allowed: boolean; error?: string }> {
    if (!messageId) {
      // 发送消息需要验证双方关系
      return { allowed: true }
    }

    const { data: message, error } = await supabase
      .from('messages')
      .select('sender_id, receiver_id')
      .eq('id', messageId)
      .single()

    if (error) {
      return { allowed: false, error: '消息不存在' }
    }

    // 用户必须是消息的发送者或接收者
    return { 
      allowed: message.sender_id === context.userId || message.receiver_id === context.userId 
    }
  }

  // 验证评价权限
  private static async validateReviewPermission(
    context: SecurityContext, 
    action: string, 
    reviewId?: string
  ): Promise<{ allowed: boolean; error?: string }> {
    if (!reviewId) {
      // 创建评价需要验证双方关系
      return { allowed: true }
    }

    const { data: review, error } = await supabase
      .from('reviews')
      .select('reviewer_id')
      .eq('id', reviewId)
      .single()

    if (error) {
      return { allowed: false, error: '评价不存在' }
    }

    // 用户必须是评价的创建者
    return { allowed: review.reviewer_id === context.userId }
  }

  // 输入验证
  static validateInput(data: any, rules: ValidationRule[]): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    for (const rule of rules) {
      const value = data[rule.field]
      
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} 是必填字段`)
        continue
      }

      if (value !== undefined && value !== null) {
        switch (rule.type) {
          case 'email':
            if (!this.isValidEmail(value)) {
              errors.push(`${rule.field} 格式不正确`)
            }
            break
          case 'phone':
            if (!this.isValidPhone(value)) {
              errors.push(`${rule.field} 格式不正确`)
            }
            break
          case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
              errors.push(`${rule.field} 必须是数字`)
            } else if (rule.min !== undefined && value < rule.min) {
              errors.push(`${rule.field} 不能小于 ${rule.min}`)
            } else if (rule.max !== undefined && value > rule.max) {
              errors.push(`${rule.field} 不能大于 ${rule.max}`)
            }
            break
          case 'string':
            if (typeof value !== 'string') {
              errors.push(`${rule.field} 必须是字符串`)
            } else if (rule.minLength && value.length < rule.minLength) {
              errors.push(`${rule.field} 长度不能小于 ${rule.minLength}`)
            } else if (rule.maxLength && value.length > rule.maxLength) {
              errors.push(`${rule.field} 长度不能大于 ${rule.maxLength}`)
            }
            break
          case 'array':
            if (!Array.isArray(value)) {
              errors.push(`${rule.field} 必须是数组`)
            } else if (rule.minItems && value.length < rule.minItems) {
              errors.push(`${rule.field} 元素数量不能小于 ${rule.minItems}`)
            } else if (rule.maxItems && value.length > rule.maxItems) {
              errors.push(`${rule.field} 元素数量不能大于 ${rule.maxItems}`)
            }
            break
        }
      }
    }

    return { valid: errors.length === 0, errors }
  }

  // 邮箱验证
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // 手机号验证
  private static isValidPhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/
    return phoneRegex.test(phone)
  }

  // 记录安全审计日志
  static async logSecurityEvent(
    context: SecurityContext,
    eventType: string,
    details: any
  ): Promise<void> {
    try {
      await supabase.from('audit_logs').insert({
        user_id: context.userId,
        action_type: eventType,
        table_name: 'security',
        old_values: null,
        new_values: details,
        ip_address: context.ipAddress,
        user_agent: context.userAgent
      })
    } catch (error) {
      console.error('记录安全审计日志失败:', error)
    }
  }

  // 防止SQL注入
  static sanitizeInput(input: string): string {
    return input
      .replace(/[;'"\\]/g, '')
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  }

  // 验证文件上传
  static validateFileUpload(file: File, allowedTypes: string[], maxSize: number): { valid: boolean; error?: string } {
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: '不支持的文件类型' }
    }

    if (file.size > maxSize) {
      return { valid: false, error: `文件大小不能超过 ${maxSize / 1024 / 1024}MB` }
    }

    return { valid: true }
  }
}

// 验证规则接口
export interface ValidationRule {
  field: string
  type: 'string' | 'number' | 'email' | 'phone' | 'array'
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  minItems?: number
  maxItems?: number
  enum?: string[]
}

// 预定义的验证规则
export const ValidationRules = {
  job: [
    { field: 'title', type: 'string', required: true, minLength: 5, maxLength: 200 },
    { field: 'description', type: 'string', required: true, minLength: 10, maxLength: 2000 },
    { field: 'salary_range', type: 'string', required: false, maxLength: 100 },
    { field: 'work_location', type: 'string', required: true, maxLength: 200 },
    { field: 'job_type', type: 'string', required: true },
    { field: 'category', type: 'string', required: false },
    { field: 'skills_required', type: 'array', required: false, maxItems: 20 }
  ] as ValidationRule[],
  
  application: [
    { field: 'job_id', type: 'string', required: true },
    { field: 'cover_letter', type: 'string', required: false, maxLength: 1000 }
  ] as ValidationRule[],
  
  review: [
    { field: 'rating', type: 'number', required: true, min: 1, max: 5 },
    { field: 'review_text', type: 'string', required: false, maxLength: 500 }
  ] as ValidationRule[],
  
  message: [
    { field: 'receiver_id', type: 'string', required: true },
    { field: 'content', type: 'string', required: true, minLength: 1, maxLength: 2000 }
  ] as ValidationRule[]
}