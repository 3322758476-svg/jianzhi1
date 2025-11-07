import { useUserStore } from '../stores/user'
import { permissionService, Permission } from './permissionService'
import { supabase } from '@/lib/supabase'

/**
 * 企业数据服务 - 提供企业相关的数据操作功能
 * 实现数据隔离、权限控制和业务逻辑封装
 */
export class CompanyDataService {
  
  /**
   * 获取当前用户所在公司的ID
   * 基于用户角色和权限进行数据隔离
   */
  private async getCurrentCompanyId(): Promise<string | null> {
    const userStore = useUserStore()
    const user = userStore.user
    
    // 验证用户身份和企业角色
    if (!user || user.role !== 'company') {
      console.warn('用户未登录或非企业角色')
      return null
    }
    
    try {
      // 从 companies 表获取公司ID，确保数据隔离
      const { data, error } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (error) {
        console.warn('获取公司ID失败:', error.message)
        return null
      }
      
      return data?.id || null
    } catch (error) {
      console.error('获取公司ID异常:', error)
      return null
    }
  }

  /**
   * 获取企业控制台统计数据
   * 包括岗位统计、申请统计等关键指标
   */
  async getDashboardStats() {
    const companyId = await this.getCurrentCompanyId()
    if (!companyId) {
      throw new Error('未找到公司信息，请检查用户权限')
    }

    try {
      // 并行获取岗位和申请数据以提高性能
      const [jobsPromise, applicationsPromise] = await Promise.all([
        // 获取岗位统计
        supabase
          .from('jobs')
          .select('id, status, created_at')
          .eq('company_id', companyId),
        
        // 获取申请统计（通过关联查询确保数据隔离）
        supabase
          .from('applications')
          .select('id, status, jobs!inner(company_id)')
          .eq('jobs.company_id', companyId)
      ])

      const { data: jobsData, error: jobsError } = jobsPromise
      const { data: appsData, error: appsError } = applicationsPromise

      if (jobsError) throw new Error(`岗位数据获取失败: ${jobsError.message}`)
      if (appsError) throw new Error(`申请数据获取失败: ${appsError.message}`)

      // 计算关键指标
      const totalJobs = jobsData?.length || 0
      const activeJobs = jobsData?.filter(job => job.status === 'active').length || 0
      const totalApplications = appsData?.length || 0
      const pendingApplications = appsData?.filter(app => app.status === 'pending').length || 0

      return {
        totalJobs,
        activeJobs,
        totalApplications,
        pendingApplications,
        jobsTrend: this.calculateTrend(jobsData),
        applicationsTrend: this.calculateTrend(appsData)
      }
    } catch (error) {
      console.error('获取控制台统计数据失败:', error)
      throw error
    }
  }

  /**
   * 获取企业岗位列表（带数据隔离和权限控制）
   */
  async getCompanyJobs(filters: {
    status?: string
    keyword?: string
    page?: number
    pageSize?: number
  } = {}) {
    const companyId = await this.getCurrentCompanyId()
    if (!companyId) {
      throw new Error('未找到公司信息')
    }

    // 权限验证
    if (!(await permissionService.hasPermission(Permission.JOB_VIEW))) {
      throw new Error('无权限查看岗位列表')
    }

    try {
      // 构建查询条件
      let query = supabase
        .from('jobs')
        .select('*', { count: 'exact' })
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      // 应用筛选条件
      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.keyword) {
        query = query.or(`title.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%`)
      }

      // 分页处理
      const page = filters.page || 1
      const pageSize = filters.pageSize || 10
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return {
        jobs: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    } catch (error) {
      console.error('获取企业岗位列表失败:', error)
      throw error
    }
  }

  /**
   * 创建新岗位（带权限验证）
   */
  async createJob(jobData: {
    title: string
    description: string
    salary_range: string
    work_location: string
    work_hours: string
    recruit_count: number
    skills_required: string[]
    category: string
    job_type: string
    status?: string
  }) {
    const companyId = await this.getCurrentCompanyId()
    if (!companyId) {
      throw new Error('未找到公司信息')
    }

    // 权限验证
    if (!(await permissionService.hasPermission(Permission.JOB_CREATE))) {
      throw new Error('无权限创建岗位')
    }

    try {
      const currentTime = new Date().toISOString()
      
      const { data, error } = await supabase
        .from('jobs')
        .insert([{
          ...jobData,
          company_id: companyId,
          // 使用jobData中的status，如果没有则默认为'active'
          status: jobData.status || 'active',
          created_at: currentTime,
          updated_at: currentTime
        }])
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('创建岗位失败 - 详细错误信息:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        originalError: error
      })
      throw error
    }
  }

  /**
   * 更新岗位信息
   */
  async updateJob(jobId: string, updateData: Partial<{
    title: string
    description: string
    salary_range: string
    work_location: string
    work_hours: string
    recruit_count: number
    skills_required: string[]
    category: string
    job_type: string
    status: string
  }>) {
    // 验证 jobId
    if (!jobId || jobId === 'undefined') {
      throw new Error('岗位ID无效')
    }
    
    const companyId = await this.getCurrentCompanyId()
    if (!companyId) {
      throw new Error('未找到公司信息')
    }

    // 权限验证
    if (!(await permissionService.hasPermission(Permission.JOB_EDIT))) {
      throw new Error('无权限编辑岗位')
    }

    try {
      const { data, error } = await supabase
        .from('jobs')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('company_id', companyId) // 确保数据隔离
        .select()
        .single()

      if (error) {
        console.error('更新岗位失败 - 详细错误:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      return data
    } catch (error) {
      console.error('更新岗位失败 - 异常:', error)
      throw error
    }
  }

  /**
   * 删除岗位
   */
  async deleteJob(jobId: string) {
    const companyId = await this.getCurrentCompanyId()
    if (!companyId) {
      throw new Error('未找到公司信息')
    }

    // 权限验证
    if (!(await permissionService.hasPermission(Permission.JOB_DELETE))) {
      throw new Error('无权限删除岗位')
    }

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)
        .eq('company_id', companyId) // 确保数据隔离

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('删除岗位失败:', error)
      throw error
    }
  }

  /**
   * 获取企业申请列表
   */
  async getCompanyApplications(filters: {
    status?: string
    jobId?: string
    page?: number
    pageSize?: number
  } = {}) {
    const companyId = await this.getCurrentCompanyId()
    if (!companyId) {
      throw new Error('未找到公司信息')
    }

    // 权限验证
    if (!(await permissionService.hasPermission(Permission.APPLICATION_VIEW))) {
      throw new Error('无权限查看申请')
    }

    try {
      // 方法1：先获取企业所有岗位的申请，然后分别查询详细信息
      const { data: companyJobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id')
        .eq('company_id', companyId)
      
      if (jobsError) throw jobsError
      
      const jobIds = companyJobs?.map(job => job.id) || []
      
      if (jobIds.length === 0) {
        return {
          applications: [],
          total: 0,
          page: filters.page || 1,
          pageSize: filters.pageSize || 10,
          totalPages: 0
        }
      }

      // 构建基础查询
      let query = supabase
        .from('applications')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      // 应用筛选条件
      if (filters.jobId) {
        query = query.eq('job_id', filters.jobId)
      } else {
        query = query.in('job_id', jobIds)
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      // 分页处理
      const page = filters.page || 1
      const pageSize = filters.pageSize || 10
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      query = query.range(from, to)

      const { data: applications, error, count } = await query

      if (error) throw error

      if (!applications || applications.length === 0) {
        return {
          applications: [],
          total: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize)
        }
      }

      // 获取关联的岗位信息
      const jobIdsFromApplications = [...new Set(applications.map(app => app.job_id))]
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*')
        .in('id', jobIdsFromApplications)

      // 获取关联的学生信息
      const studentIds = [...new Set(applications.map(app => app.student_id))]
      const { data: profilesData } = await supabase
        .from('students')
        .select('id, real_name, avatar_url, school, major, grade')
        .in('id', studentIds)

      // 构建完整数据
      const enrichedApplications = applications.map(app => ({
        ...app,
        jobs: jobsData?.find(job => job.id === app.job_id) || null,
        profiles: profilesData?.find(profile => profile.id === app.student_id) || null
      }))

      return {
        applications: enrichedApplications,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    } catch (error) {
      console.error('获取企业申请列表失败:', error)
      throw error
    }
  }

  /**
   * 更新申请状态
   */
  async updateApplicationStatus(applicationId: string, status: string, reviewNotes?: string) {
    const companyId = await this.getCurrentCompanyId()
    if (!companyId) {
      throw new Error('未找到公司信息')
    }

    // 根据状态验证权限
    let requiredPermission: Permission
    switch (status) {
      case 'reviewing':
        requiredPermission = Permission.APPLICATION_REVIEW
        break
      case 'accepted':
        requiredPermission = Permission.APPLICATION_APPROVE
        break
      case 'rejected':
        requiredPermission = Permission.APPLICATION_REJECT
        break
      default:
        throw new Error('无效的申请状态')
    }

    if (!(await permissionService.hasPermission(requiredPermission))) {
      throw new Error(`无权限${this.getStatusActionText(status)}申请`)
    }

    try {
      // 首先验证申请是否属于当前公司
      const { data: applicationData, error: checkError } = await supabase
        .from('applications')
        .select(`
          id,
          jobs (
            company_id
          )
        `)
        .eq('id', applicationId)
        .eq('jobs.company_id', companyId)
        .maybeSingle()
      
      if (checkError || !applicationData) {
        throw new Error('申请不存在或无权限操作')
      }
      
      // 更新申请状态
      const { data, error } = await supabase
        .from('applications')
        .update({
          status,
          review_notes: reviewNotes,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('更新申请状态失败:', error)
      throw error
    }
  }

  /**
   * 导出申请数据为CSV格式
   */
  async exportApplicationsToCSV(filters: { jobId?: string; status?: string } = {}) {
    const companyId = await this.getCurrentCompanyId()
    if (!companyId) {
      throw new Error('未找到公司信息')
    }

    // 权限验证
    if (!(await permissionService.hasPermission(Permission.APPLICATION_EXPORT))) {
      throw new Error('无权限导出申请数据')
    }

    try {
      // 先获取该企业的所有岗位ID
      const { data: companyJobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id')
        .eq('company_id', companyId)
      
      if (jobsError) throw jobsError
      
      const jobIds = companyJobs?.map(job => job.id) || []
      
      if (jobIds.length === 0) {
        return '' // 没有岗位，返回空CSV
      }

      let query = supabase
        .from('applications')
        .select(`
          *,
          jobs!inner(title, company_id),
          profiles!applications_student_id_fkey(name, university, major, phone, email)
        `)

      // 应用筛选条件
      if (filters.jobId) {
        // 如果指定了具体岗位，直接使用该岗位ID
        query = query.eq('job_id', filters.jobId)
      } else {
        // 否则使用企业所有岗位ID进行筛选
        query = query.in('job_id', jobIds)
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query

      if (error) throw error

      // 生成CSV内容
      const headers = [
        '申请ID',
        '岗位名称',
        '学生姓名',
        '大学',
        '专业',
        '联系电话',
        '邮箱',
        '申请状态',
        '申请时间',
        '审核时间',
        '审核备注'
      ]

      const rows = data?.map(item => [
        item.id,
        item.jobs?.title || '',
        item.profiles?.name || '',
        item.profiles?.university || '',
        item.profiles?.major || '',
        item.profiles?.phone || '',
        item.profiles?.email || '',
        item.status,
        item.created_at,
        item.reviewed_at || '',
        item.review_notes || ''
      ]) || []

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n')

      return csvContent
    } catch (error) {
      console.error('导出申请数据失败:', error)
      throw error
    }
  }

  /**
   * 获取企业分析数据
   */
  async getCompanyAnalytics(period: 'week' | 'month' | 'quarter' = 'month') {
    const companyId = await this.getCurrentCompanyId()
    if (!companyId) {
      throw new Error('未找到公司信息')
    }

    // 权限验证
    if (!(await permissionService.hasPermission(Permission.ANALYTICS_VIEW))) {
      throw new Error('无权限查看分析数据')
    }

    try {
      // 这里可以添加更复杂的分析查询逻辑
      // 目前返回基础数据，后续可以根据需求扩展
      const stats = await this.getDashboardStats()
      
      return {
        ...stats,
        period,
        // 可以添加更多分析指标
        conversionRate: this.calculateConversionRate(stats),
        averageResponseTime: '24h' // 示例数据
      }
    } catch (error) {
      console.error('获取企业分析数据失败:', error)
      throw error
    }
  }

  // ========== 辅助方法 ==========

  /**
   * 计算数据趋势
   */
  private calculateTrend(data: any[] | null): number {
    if (!data || data.length < 2) return 0
    
    // 简化的趋势计算逻辑
    // 实际项目中可以根据具体需求实现更复杂的趋势算法
    const recentData = data.slice(-2)
    if (recentData.length < 2) return 0
    
    return recentData[1].id > recentData[0].id ? 1 : -1
  }

  /**
   * 计算转化率
   */
  private calculateConversionRate(stats: any): number {
    if (!stats.totalApplications || stats.totalApplications === 0) return 0
    
    const acceptedApplications = stats.totalApplications - stats.pendingApplications
    return (acceptedApplications / stats.totalApplications) * 100
  }

  /**
   * 获取状态操作文本
   */
  private getStatusActionText(status: string): string {
    const actions: Record<string, string> = {
      reviewing: '审核',
      accepted: '批准',
      rejected: '拒绝'
    }
    return actions[status] || '处理'
  }

  /**
   * 发送面试通知
   */
  async sendInterviewNotification(applicationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 获取申请信息，包括学生信息和岗位信息
      const { data: application, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            title
          )
        `)
        .eq('id', applicationId)
        .single()

      if (error || !application) {
        console.error('获取申请信息失败:', error)
        return { success: false, error: '申请信息不存在' }
      }

      // 获取学生信息
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('user_id')
        .eq('id', application.student_id)
        .single()

      if (studentError || !studentData) {
        console.error('获取学生信息失败:', studentError)
        return { success: false, error: '学生信息不存在' }
      }

      // 检查学生信息是否存在
      if (!studentData.user_id) {
        console.error('学生用户ID不存在:', studentData)
        return { success: false, error: '学生用户信息不完整' }
      }

      // 创建面试通知
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: studentData.user_id,
          type: 'application',
          title: '面试通知',
          description: `恭喜！您的申请"${application.jobs?.title || '未知岗位'}"已通过审核，请等待面试安排。`,
          related_id: applicationId,
          important: true
        })

      if (notificationError) {
        console.error('创建通知失败:', notificationError)
        return { success: false, error: '发送通知失败' }
      }

      console.log('面试通知发送成功，学生ID:', studentData.user_id)
      return { success: true }
    } catch (error) {
      console.error('发送面试通知异常:', error)
      return { success: false, error: '发送通知异常' }
    }
  }

  /**
   * 发送拒绝通知
   */
  async sendRejectionNotification(applicationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 获取申请信息，包括学生信息和岗位信息
      const { data: application, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            title
          )
        `)
        .eq('id', applicationId)
        .single()

      if (error || !application) {
        console.error('获取申请信息失败:', error)
        return { success: false, error: '申请信息不存在' }
      }

      // 获取学生信息
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('user_id')
        .eq('id', application.student_id)
        .single()

      if (studentError || !studentData) {
        console.error('获取学生信息失败:', studentError)
        return { success: false, error: '学生信息不存在' }
      }

      // 检查学生信息是否存在
      if (!studentData.user_id) {
        console.error('学生用户ID不存在:', studentData)
        return { success: false, error: '学生用户信息不完整' }
      }

      // 创建拒绝通知
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: studentData.user_id,
          type: 'application',
          title: '申请结果通知',
          description: `很遗憾，您的申请"${application.jobs?.title || '未知岗位'}"未能通过审核。`,
          related_id: applicationId,
          important: false
        })

      if (notificationError) {
        console.error('创建通知失败:', notificationError)
        return { success: false, error: '发送通知失败' }
      }

      console.log('拒绝通知发送成功，学生ID:', studentData.user_id)
      return { success: true }
    } catch (error) {
      console.error('发送拒绝通知异常:', error)
      return { success: false, error: '发送通知异常' }
    }
  }
}

// 创建单例实例
export const companyDataService = new CompanyDataService()