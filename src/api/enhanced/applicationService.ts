// 增强的申请服务模块 - 包含完整的申请流程管理

import { supabase } from '@/lib/supabase'
import { SecurityService, SecurityContext, ValidationRules } from './security'
import type { Database } from '@/lib/supabase'

type Application = Database['public']['Tables']['applications']['Row']
type ApplicationInsert = Database['public']['Tables']['applications']['Insert']

export interface ApplicationStats {
  totalApplications: number
  pendingApplications: number
  acceptedApplications: number
  rejectedApplications: number
  avgProcessingTime?: number
}

export interface ApplicationWithDetails extends Application {
  job?: {
    title: string
    company_name: string
    logo_url?: string
  }
  student?: {
    real_name: string
    school: string
    major: string
  }
}

export class EnhancedApplicationService {
  // 提交申请
  static async submitApplication(
    applicationData: ApplicationInsert,
    context: SecurityContext
  ): Promise<{ application: Application | null; error?: string }> {
    try {
      // 验证权限
      const permission = await SecurityService.validatePermission(context, 'application', 'write')
      if (!permission.allowed) {
        return { application: null, error: permission.error || '没有权限提交申请' }
      }

      // 验证输入数据
      const validation = SecurityService.validateInput(applicationData, ValidationRules.application)
      if (!validation.valid) {
        return { application: null, error: validation.errors.join(', ') }
      }

      // 检查岗位是否存在且活跃
      const { data: job } = await supabase
        .from('jobs')
        .select('id, status, application_deadline')
        .eq('id', applicationData.job_id)
        .single()

      if (!job) {
        return { application: null, error: '岗位不存在' }
      }

      if (job.status !== 'active') {
        return { application: null, error: '该岗位已停止招聘' }
      }

      if (job.application_deadline && new Date(job.application_deadline) < new Date()) {
        return { application: null, error: '申请已截止' }
      }

      // 检查是否已申请过该岗位
      const { data: existingApplication } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', applicationData.job_id)
        .eq('student_id', applicationData.student_id)
        .single()

      if (existingApplication) {
        return { application: null, error: '您已经申请过该岗位' }
      }

      // 获取学生信息
      const { data: student } = await supabase
        .from('students')
        .select('user_id, resume_url')
        .eq('id', applicationData.student_id)
        .single()

      if (!student || student.user_id !== context.userId) {
        return { application: null, error: '学生信息不存在或没有权限' }
      }

      // 创建申请
      const { data: application, error } = await supabase
        .from('applications')
        .insert({
          ...applicationData,
          status: 'pending',
          applied_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // 增加岗位申请数
      await this.incrementApplicationCount(applicationData.job_id)

      // 发送通知给企业
      await this.sendApplicationNotification(applicationData.job_id, application.id)

      // 记录申请日志
      await SecurityService.logSecurityEvent(context, 'application_submit', {
        applicationId: application.id,
        jobId: applicationData.job_id
      })

      return { application }
    } catch (error: any) {
      await SecurityService.logSecurityEvent(context, 'application_submit_error', {
        applicationData,
        error: error.message
      })
      
      return { application: null, error: '提交申请失败' }
    }
  }

  // 获取申请详情
  static async getApplicationDetail(
    applicationId: string,
    context: SecurityContext
  ): Promise<{ application: ApplicationWithDetails | null; error?: string }> {
    try {
      // 验证权限
      const permission = await SecurityService.validatePermission(context, 'application', 'read', applicationId)
      if (!permission.allowed) {
        return { application: null, error: permission.error || '没有权限查看该申请' }
      }

      const { data: application, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            title,
            company_name,
            logo_url
          ),
          students (
            real_name,
            school,
            major
          )
        `)
        .eq('id', applicationId)
        .single()

      if (error) throw error

      return { application }
    } catch (error: any) {
      await SecurityService.logSecurityEvent(context, 'application_detail_error', {
        applicationId,
        error: error.message
      })
      
      return { application: null, error: '获取申请详情失败' }
    }
  }

  // 更新申请状态
  static async updateApplicationStatus(
    applicationId: string,
    status: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'cancelled',
    context: SecurityContext,
    feedback?: string
  ): Promise<{ application: Application | null; error?: string }> {
    try {
      // 验证权限
      const permission = await SecurityService.validatePermission(context, 'application', 'write', applicationId)
      if (!permission.allowed) {
        return { application: null, error: permission.error || '没有权限更新申请状态' }
      }

      const updateData: any = {
        status,
        reviewed_at: status !== 'pending' ? new Date().toISOString() : null
      }

      if (feedback) {
        updateData.feedback = feedback
      }

      const { data: application, error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', applicationId)
        .select()
        .single()

      if (error) throw error

      // 发送状态变更通知
      await this.sendStatusChangeNotification(applicationId, status)

      // 记录状态更新日志
      await SecurityService.logSecurityEvent(context, 'application_status_update', {
        applicationId,
        status,
        feedback
      })

      return { application }
    } catch (error: any) {
      await SecurityService.logSecurityEvent(context, 'application_status_update_error', {
        applicationId,
        status,
        error: error.message
      })
      
      return { application: null, error: '更新申请状态失败' }
    }
  }

  // 获取学生申请列表
  static async getStudentApplications(
    studentId: string,
    context: SecurityContext,
    page: number = 1,
    pageSize: number = 20,
    status?: string
  ): Promise<{ applications: ApplicationWithDetails[]; total: number; error?: string }> {
    try {
      // 验证权限
      const { data: student } = await supabase
        .from('students')
        .select('user_id')
        .eq('id', studentId)
        .single()

      if (!student || student.user_id !== context.userId) {
        return { applications: [], total: 0, error: '没有权限查看申请记录' }
      }

      let query = supabase
        .from('applications')
        .select(`
          *,
          jobs (
            title,
            company_name,
            logo_url
          )
        `, { count: 'exact' })
        .eq('student_id', studentId)

      if (status) {
        query = query.eq('status', status)
      }

      const { data: applications, error, count } = await query
        .order('applied_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (error) throw error

      return {
        applications: applications || [],
        total: count || 0
      }
    } catch (error: any) {
      await SecurityService.logSecurityEvent(context, 'student_applications_error', {
        studentId,
        error: error.message
      })
      
      return { applications: [], total: 0, error: '获取申请列表失败' }
    }
  }

  // 获取岗位申请列表
  static async getJobApplications(
    jobId: string,
    context: SecurityContext,
    page: number = 1,
    pageSize: number = 20,
    status?: string
  ): Promise<{ applications: ApplicationWithDetails[]; total: number; error?: string }> {
    try {
      // 验证权限
      const permission = await SecurityService.validatePermission(context, 'application', 'read')
      if (!permission.allowed) {
        return { applications: [], total: 0, error: permission.error || '没有权限查看申请记录' }
      }

      let query = supabase
        .from('applications')
        .select(`
          *,
          students (
            real_name,
            school,
            major,
            resume_url
          )
        `, { count: 'exact' })
        .eq('job_id', jobId)

      if (status) {
        query = query.eq('status', status)
      }

      const { data: applications, error, count } = await query
        .order('applied_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (error) throw error

      return {
        applications: applications || [],
        total: count || 0
      }
    } catch (error: any) {
      await SecurityService.logSecurityEvent(context, 'job_applications_error', {
        jobId,
        error: error.message
      })
      
      return { applications: [], total: 0, error: '获取申请列表失败' }
    }
  }

  // 获取申请统计信息
  static async getApplicationStatistics(
    context: SecurityContext
  ): Promise<{ stats: ApplicationStats; error?: string }> {
    try {
      // 获取总申请数
      const { count: totalApplications } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })

      // 获取各状态申请数
      const { data: statusCounts } = await supabase
        .from('applications')
        .select('status')

      const stats = statusCounts?.reduce((acc: any, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1
        return acc
      }, {}) || {}

      const applicationStats: ApplicationStats = {
        totalApplications: totalApplications || 0,
        pendingApplications: stats.pending || 0,
        acceptedApplications: stats.accepted || 0,
        rejectedApplications: stats.rejected || 0
      }

      return { stats: applicationStats }
    } catch (error: any) {
      await SecurityService.logSecurityEvent(context, 'application_statistics_error', {
        error: error.message
      })
      
      return { stats: {} as ApplicationStats, error: '获取申请统计失败' }
    }
  }

  // 批量处理申请
  static async batchProcessApplications(
    applicationIds: string[],
    context: SecurityContext,
    status: 'accepted' | 'rejected',
    feedback?: string
  ): Promise<{ processedCount: number; error?: string }> {
    try {
      // 验证权限
      for (const applicationId of applicationIds) {
        const permission = await SecurityService.validatePermission(context, 'application', 'write', applicationId)
        if (!permission.allowed) {
          return { processedCount: 0, error: `没有权限处理申请 ${applicationId}` }
        }
      }

      const updateData = {
        status,
        reviewed_at: new Date().toISOString(),
        feedback: feedback || null
      }

      const { data, error } = await supabase
        .from('applications')
        .update(updateData)
        .in('id', applicationIds)
        .select()

      if (error) throw error

      // 发送批量处理通知
      for (const application of data || []) {
        await this.sendStatusChangeNotification(application.id, status)
      }

      // 记录批量处理日志
      await SecurityService.logSecurityEvent(context, 'application_batch_process', {
        applicationIds,
        status,
        processedCount: data?.length || 0
      })

      return { processedCount: data?.length || 0 }
    } catch (error: any) {
      await SecurityService.logSecurityEvent(context, 'application_batch_process_error', {
        applicationIds,
        status,
        error: error.message
      })
      
      return { processedCount: 0, error: '批量处理申请失败' }
    }
  }

  // 私有方法：增加申请数
  private static async incrementApplicationCount(jobId: string): Promise<void> {
    try {
      await supabase.rpc('increment_job_applications', { job_id: jobId })
    } catch (error) {
      console.error('增加申请数失败:', error)
    }
  }

  // 私有方法：发送申请通知
  private static async sendApplicationNotification(jobId: string, applicationId: string): Promise<void> {
    try {
      // 获取企业用户ID
      const { data: job } = await supabase
        .from('jobs')
        .select('company_id, title')
        .eq('id', jobId)
        .single()

      if (!job) return

      const { data: company } = await supabase
        .from('companies')
        .select('user_id')
        .eq('id', job.company_id)
        .single()

      if (!company) return

      // 创建通知
      await supabase.from('notifications').insert({
        user_id: company.user_id,
        type: 'application',
        title: '新申请通知',
        description: `您的岗位"${job.title}"收到新的申请`,
        related_id: applicationId,
        important: true
      })
    } catch (error) {
      console.error('发送申请通知失败:', error)
    }
  }

  // 私有方法：发送状态变更通知
  private static async sendStatusChangeNotification(applicationId: string, status: string): Promise<void> {
    try {
      // 获取申请信息
      const { data: application } = await supabase
        .from('applications')
        .select('student_id, jobs(title)')
        .eq('id', applicationId)
        .single()

      if (!application) return

      // 获取学生用户ID
      const { data: student } = await supabase
        .from('students')
        .select('user_id')
        .eq('id', application.student_id)
        .single()

      if (!student) return

      const statusTexts = {
        'accepted': '已通过',
        'rejected': '已拒绝',
        'reviewing': '正在审核'
      }

      const statusText = statusTexts[status as keyof typeof statusTexts] || status

      // 创建通知
      await supabase.from('notifications').insert({
        user_id: student.user_id,
        type: 'application',
        title: '申请状态更新',
        description: `您的申请"${application.jobs[0]?.title}"状态已更新为：${statusText}`,
        related_id: applicationId,
        important: status === 'accepted'
      })
    } catch (error) {
      console.error('发送状态变更通知失败:', error)
    }
  }
}