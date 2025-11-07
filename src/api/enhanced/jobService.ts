// 增强的岗位服务模块 - 包含完整的业务逻辑

import { supabase } from '@/lib/supabase'
import { SecurityService, SecurityContext, ValidationRules } from './security'
import type { Database } from '@/lib/supabase'

type Job = Database['public']['Tables']['jobs']['Row']
type JobInsert = Database['public']['Tables']['jobs']['Insert']

export interface JobSearchParams {
  query?: string
  categories?: string[]
  jobTypes?: string[]
  locations?: string[]
  salaryMin?: number
  salaryMax?: number
  page?: number
  pageSize?: number
  sortBy?: 'created_at' | 'views_count' | 'applications_count' | 'salary'
  sortOrder?: 'asc' | 'desc'
}

export interface JobStatistics {
  totalJobs: number
  activeJobs: number
  totalApplications: number
  avgSalary?: number
  popularCategories: Array<{ category: string; count: number }>
}

export class EnhancedJobService {
  // 搜索岗位
  static async searchJobs(
    params: JobSearchParams,
    context: SecurityContext
  ): Promise<{ jobs: Job[]; total: number; error?: string }> {
    try {
      // 验证搜索参数
      const validation = SecurityService.validateInput(params, [
        { field: 'query', type: 'string', required: false, maxLength: 100 },
        { field: 'page', type: 'number', required: false, min: 1 },
        { field: 'pageSize', type: 'number', required: false, min: 1, max: 100 }
      ])

      if (!validation.valid) {
        return { jobs: [], total: 0, error: validation.errors.join(', ') }
      }

      const {
        query = '',
        categories = [],
        jobTypes = [],
        locations = [],
        salaryMin,
        salaryMax,
        page = 1,
        pageSize = 20,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = params

      // 使用自定义函数进行高级搜索
      const { data, error } = await supabase.rpc('search_jobs', {
        search_query: query || null,
        categories: categories.length > 0 ? categories : null,
        job_types: jobTypes.length > 0 ? jobTypes : null,
        locations: locations.length > 0 ? locations.map(loc => `%${loc}%`) : null,
        salary_min: salaryMin || null,
        salary_max: salaryMax || null,
        page_num: page,
        page_size: pageSize
      })

      if (error) throw error

      return {
        jobs: data || [],
        total: data?.[0]?.total_count || 0
      }
    } catch (error: any) {
      await SecurityService.logSecurityEvent(context, 'job_search_error', {
        params,
        error: error.message
      })
      
      return { jobs: [], total: 0, error: '搜索岗位失败' }
    }
  }

  // 获取岗位详情
  static async getJobDetail(
    jobId: string,
    context: SecurityContext
  ): Promise<{ job: Job | null; error?: string }> {
    try {
      // 验证权限
      const permission = await SecurityService.validatePermission(context, 'job', 'read', jobId)
      if (!permission.allowed) {
        return { job: null, error: permission.error || '没有权限查看该岗位' }
      }

      const { data: job, error } = await supabase
        .from('jobs')
        .select(`
          *,
          companies (
            company_name,
            industry,
            scale,
            address,
            contact_person,
            contact_phone,
            contact_email,
            description,
            logo_url,
            verified,
            user_id
          )
        `)
        .eq('id', jobId)
        .single()

      if (error) throw error

      // 增加浏览量（异步执行，不阻塞返回）
      this.incrementViewCount(jobId).catch(console.error)

      // 记录查看日志
      await SecurityService.logSecurityEvent(context, 'job_view', { jobId })

      return { job }
    } catch (error: any) {
      await SecurityService.logSecurityEvent(context, 'job_detail_error', {
        jobId,
        error: error.message
      })
      
      return { job: null, error: '获取岗位详情失败' }
    }
  }

  // 创建岗位
  static async createJob(
    jobData: JobInsert,
    context: SecurityContext
  ): Promise<{ job: Job | null; error?: string }> {
    try {
      // 验证权限
      const permission = await SecurityService.validatePermission(context, 'job', 'write')
      if (!permission.allowed) {
        return { job: null, error: permission.error || '没有权限创建岗位' }
      }

      // 验证输入数据
      const validation = SecurityService.validateInput(jobData, ValidationRules.job)
      if (!validation.valid) {
        return { job: null, error: validation.errors.join(', ') }
      }

      // 验证企业是否存在且属于当前用户
      const { data: company } = await supabase
        .from('companies')
        .select('id, user_id')
        .eq('id', jobData.company_id)
        .single()

      if (!company || company.user_id !== context.userId) {
        return { job: null, error: '企业不存在或没有权限' }
      }

      // 创建岗位
      const { data: job, error } = await supabase
        .from('jobs')
        .insert({
          ...jobData,
          status: 'active'
        })
        .select()
        .single()

      if (error) throw error

      // 记录创建日志
      await SecurityService.logSecurityEvent(context, 'job_create', { jobId: job.id })

      return { job }
    } catch (error: any) {
      await SecurityService.logSecurityEvent(context, 'job_create_error', {
        jobData,
        error: error.message
      })
      
      return { job: null, error: '创建岗位失败' }
    }
  }

  // 更新岗位
  static async updateJob(
    jobId: string,
    updateData: Partial<JobInsert>,
    context: SecurityContext
  ): Promise<{ job: Job | null; error?: string }> {
    try {
      // 验证权限
      const permission = await SecurityService.validatePermission(context, 'job', 'write', jobId)
      if (!permission.allowed) {
        return { job: null, error: permission.error || '没有权限更新岗位' }
      }

      // 验证输入数据
      const validation = SecurityService.validateInput(updateData, ValidationRules.job.map(rule => ({
        ...rule,
        required: false // 更新时字段不是必填的
      })))
      
      if (!validation.valid) {
        return { job: null, error: validation.errors.join(', ') }
      }

      const { data: job, error } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', jobId)
        .select()
        .single()

      if (error) throw error

      // 记录更新日志
      await SecurityService.logSecurityEvent(context, 'job_update', { jobId })

      return { job }
    } catch (error: any) {
      await SecurityService.logSecurityEvent(context, 'job_update_error', {
        jobId,
        updateData,
        error: error.message
      })
      
      return { job: null, error: '更新岗位失败' }
    }
  }

  // 删除岗位
  static async deleteJob(
    jobId: string,
    context: SecurityContext
  ): Promise<{ error?: string }> {
    try {
      // 验证权限
      const permission = await SecurityService.validatePermission(context, 'job', 'delete', jobId)
      if (!permission.allowed) {
        return { error: permission.error || '没有权限删除岗位' }
      }

      // 检查是否有未处理的申请
      const { data: applications } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', jobId)
        .neq('status', 'rejected')

      if (applications && applications.length > 0) {
        return { error: '该岗位还有未处理的申请，无法删除' }
      }

      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)

      if (error) throw error

      // 记录删除日志
      await SecurityService.logSecurityEvent(context, 'job_delete', { jobId })

      return {}
    } catch (error: any) {
      await SecurityService.logSecurityEvent(context, 'job_delete_error', {
        jobId,
        error: error.message
      })
      
      return { error: '删除岗位失败' }
    }
  }

  // 获取岗位统计信息
  static async getJobStatistics(context: SecurityContext): Promise<{ statistics: JobStatistics; error?: string }> {
    try {
      // 获取总岗位数
      const { count: totalJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })

      // 获取活跃岗位数
      const { count: activeJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // 获取总申请数
      const { count: totalApplications } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })

      // 获取热门分类
      const { data: categories } = await supabase
        .from('jobs')
        .select('category')
        .not('category', 'is', null)

      const categoryCounts = categories?.reduce((acc: any, job) => {
        acc[job.category] = (acc[job.category] || 0) + 1
        return acc
      }, {}) || {}

      const popularCategories = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([category, count]) => ({ category, count: count as number }))

      const statistics: JobStatistics = {
        totalJobs: totalJobs || 0,
        activeJobs: activeJobs || 0,
        totalApplications: totalApplications || 0,
        popularCategories
      }

      return { statistics }
    } catch (error: any) {
      await SecurityService.logSecurityEvent(context, 'job_statistics_error', {
        error: error.message
      })
      
      return { statistics: {} as JobStatistics, error: '获取统计信息失败' }
    }
  }

  // 获取推荐岗位
  static async getRecommendedJobs(
    userId: string,
    limit: number = 10,
    context: SecurityContext
  ): Promise<{ jobs: Job[]; error?: string }> {
    try {
      // 获取用户偏好
      const { data: student } = await supabase
        .from('students')
        .select('preferred_locations, preferred_job_types, skills')
        .eq('user_id', userId)
        .single()

      if (!student) {
        return { jobs: [], error: '用户信息不存在' }
      }

      let query = supabase
        .from('jobs')
        .select(`
          *,
          companies (
            company_name,
            logo_url,
            verified
          )
        `)
        .eq('status', 'active')

      // 根据用户偏好进行推荐
      if (student.preferred_locations && student.preferred_locations.length > 0) {
        query = query.or(student.preferred_locations.map(loc => `work_location.ilike.%${loc}%`).join(','))
      }

      if (student.preferred_job_types && student.preferred_job_types.length > 0) {
        query = query.in('job_type', student.preferred_job_types)
      }

      // 按匹配度排序
      query = query.order('created_at', { ascending: false })
        .limit(limit)

      const { data: jobs, error } = await query

      if (error) throw error

      return { jobs: jobs || [] }
    } catch (error: any) {
      await SecurityService.logSecurityEvent(context, 'job_recommendation_error', {
        userId,
        error: error.message
      })
      
      return { jobs: [], error: '获取推荐岗位失败' }
    }
  }

  // 私有方法：增加浏览量
  private static async incrementViewCount(jobId: string): Promise<void> {
    try {
      await supabase.rpc('increment_job_views', { job_id: jobId })
    } catch (error) {
      console.error('增加浏览量失败:', error)
    }
  }

  // 批量操作：更新多个岗位状态
  static async batchUpdateJobStatus(
    jobIds: string[],
    status: 'active' | 'inactive' | 'filled' | 'expired',
    context: SecurityContext
  ): Promise<{ updatedCount: number; error?: string }> {
    try {
      // 验证权限
      for (const jobId of jobIds) {
        const permission = await SecurityService.validatePermission(context, 'job', 'write', jobId)
        if (!permission.allowed) {
          return { updatedCount: 0, error: `没有权限更新岗位 ${jobId}` }
        }
      }

      const { data, error } = await supabase
        .from('jobs')
        .update({ status })
        .in('id', jobIds)
        .select()

      if (error) throw error

      // 记录批量操作日志
      await SecurityService.logSecurityEvent(context, 'job_batch_update', {
        jobIds,
        status,
        updatedCount: data?.length || 0
      })

      return { updatedCount: data?.length || 0 }
    } catch (error: any) {
      await SecurityService.logSecurityEvent(context, 'job_batch_update_error', {
        jobIds,
        status,
        error: error.message
      })
      
      return { updatedCount: 0, error: '批量更新岗位状态失败' }
    }
  }
}