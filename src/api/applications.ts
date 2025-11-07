import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Application = Database['public']['Tables']['applications']['Row']
type ApplicationInsert = Omit<Application, 'id' | 'created_at' | 'updated_at' | 'applied_at' | 'reviewed_at'>

export interface ApplicationStats {
  total: number
  pending: number
  reviewing: number
  accepted: number
  rejected: number
}

export class ApplicationsApi {
  // 提交申请
  static async createApplication(applicationData: ApplicationInsert): Promise<{ application: Application | null; error: string | null }> {
    try {
      // 检查是否已经申请过
      const { data: existing } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', applicationData.job_id)
        .eq('student_id', applicationData.student_id)
        .single()

      if (existing) {
        throw new Error('您已经申请过这个职位')
      }

      const { data, error } = await supabase
        .from('applications')
        .insert(applicationData)
        .select()
        .single()

      if (error) throw error

      // 增加职位申请数量
      await this.incrementApplicationCount(applicationData.job_id)

      return {
        application: data,
        error: null
      }
    } catch (error: any) {
      return {
        application: null,
        error: error.message || '提交申请失败'
      }
    }
  }

  // 获取申请列表
  static async getApplications(params: {
    student_id?: string
    job_id?: string
    company_id?: string
    status?: string
    page?: number
    limit?: number
  } = {}): Promise<{ applications: Application[]; total: number; error: string | null }> {
    try {
      const {
        student_id,
        job_id,
        company_id,
        status,
        page = 1,
        limit = 20
      } = params

      let queryBuilder = supabase
        .from('applications')
        .select(`
          *,
          jobs (
            title,
            company_id,
            companies!inner (
              company_name,
              logo_url
            )
          ),
          students (
            real_name,
            school,
            major,
            avatar_url
          )
        `, { count: 'exact' })

      // 过滤条件
      if (student_id) {
        queryBuilder = queryBuilder.eq('student_id', student_id)
      }
      if (job_id) {
        queryBuilder = queryBuilder.eq('job_id', job_id)
      }
      if (company_id) {
        // 使用正确的关联查询语法 - 先获取该企业的所有岗位ID
        const { data: companyJobs, error: jobsError } = await supabase
          .from('jobs')
          .select('id')
          .eq('company_id', company_id)
        
        if (jobsError) throw jobsError
        
        const jobIds = companyJobs?.map(job => job.id) || []
        
        if (jobIds.length > 0) {
          queryBuilder = queryBuilder.in('job_id', jobIds)
        } else {
          // 如果没有找到岗位，返回空结果
          return { applications: [], total: 0, error: null }
        }
      }
      if (status) {
        queryBuilder = queryBuilder.eq('status', status)
      }

      // 排序和分页
      const { data, error, count } = await queryBuilder
        .order('applied_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (error) throw error

      return {
        applications: data || [],
        total: count || 0,
        error: null
      }
    } catch (error: any) {
      return {
        applications: [],
        total: 0,
        error: error.message || '获取申请列表失败'
      }
    }
  }

  // 获取申请详情
  static async getApplicationById(applicationId: string): Promise<{ application: Application | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            *,
            companies!inner (
              company_name,
              contact_person,
              contact_phone,
              contact_email
            )
          ),
          students (
            real_name,
            school,
            major,
            phone,
            email:user_id
          )
        `)
        .eq('id', applicationId)
        .single()

      if (error) throw error

      return {
        application: data,
        error: null
      }
    } catch (error: any) {
      return {
        application: null,
        error: error.message || '获取申请详情失败'
      }
    }
  }

  // 更新申请状态
  static async updateApplicationStatus(applicationId: string, status: Application['status'], feedback?: string): Promise<{ application: Application | null; error: string | null }> {
    try {
      const updateData: any = {
        status,
        reviewed_at: new Date().toISOString()
      }

      if (feedback) {
        updateData.feedback = feedback
      }

      const { data, error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', applicationId)
        .select()
        .single()

      if (error) throw error

      return {
        application: data,
        error: null
      }
    } catch (error: any) {
      return {
        application: null,
        error: error.message || '更新申请状态失败'
      }
    }
  }

  // 取消申请
  static async cancelApplication(applicationId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'cancelled' })
        .eq('id', applicationId)

      if (error) throw error

      return { error: null }
    } catch (error: any) {
      return { error: error.message || '取消申请失败' }
    }
  }

  // 获取申请统计
  static async getApplicationStats(userId: string, userType: 'student' | 'company'): Promise<{ stats: ApplicationStats; error: string | null }> {
    try {
      let queryBuilder
      
      if (userType === 'student') {
        queryBuilder = supabase
          .from('applications')
          .select('status')
          .eq('student_id', userId)
      } else {
        // 使用正确的关联查询语法 - 分两步查询
        // 1. 先获取企业ID
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', userId)
          .single()
        
        if (companyError) throw companyError
        
        if (!companyData) {
          return {
            stats: { total: 0, pending: 0, reviewing: 0, accepted: 0, rejected: 0 },
            error: null
          }
        }
        
        // 2. 再获取该企业的所有岗位ID
        const { data: companyJobs, error: jobsError } = await supabase
          .from('jobs')
          .select('id')
          .eq('company_id', companyData.id)
        
        if (jobsError) throw jobsError
        
        const jobIds = companyJobs?.map(job => job.id) || []
        
        // 3. 最后查询这些岗位的申请
        queryBuilder = supabase
          .from('applications')
          .select('status')
          .in('job_id', jobIds)
      }

      const { data, error } = await queryBuilder

      if (error) throw error

      const stats: ApplicationStats = {
        total: data?.length || 0,
        pending: data?.filter(app => app.status === 'pending').length || 0,
        reviewing: data?.filter(app => app.status === 'reviewing').length || 0,
        accepted: data?.filter(app => app.status === 'accepted').length || 0,
        rejected: data?.filter(app => app.status === 'rejected').length || 0
      }

      return {
        stats,
        error: null
      }
    } catch (error: any) {
      return {
        stats: { total: 0, pending: 0, reviewing: 0, accepted: 0, rejected: 0 },
        error: error.message || '获取申请统计失败'
      }
    }
  }

  // 增加申请数量
  private static async incrementApplicationCount(jobId: string): Promise<void> {
    try {
      await supabase.rpc('increment_applications', { job_id: jobId })
    } catch (error) {
      console.error('增加申请数量失败:', error)
    }
  }

  // 检查是否已申请
  static async checkApplied(jobId: string, studentId: string): Promise<{ applied: boolean; application: Application | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('job_id', jobId)
        .eq('student_id', studentId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return {
        applied: !!data,
        application: data || null,
        error: null
      }
    } catch (error: any) {
      return {
        applied: false,
        application: null,
        error: error.message || '检查申请状态失败'
      }
    }
  }
}