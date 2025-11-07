import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import { enhancedApi } from './enhanced'

type Job = Database['public']['Tables']['jobs']['Row']
type JobInsert = Omit<Job, 'id' | 'created_at' | 'updated_at' | 'views_count' | 'applications_count'>

export interface JobFilters {
  category?: string
  job_type?: string
  location?: string
  salary_min?: number
  salary_max?: number
  skills?: string[]
  company_id?: string
  status?: string
}

export interface JobSearchParams {
  query?: string
  filters?: JobFilters
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export class JobsApi {
  // 获取职位列表
  static async getJobs(params: JobSearchParams = {}): Promise<{ jobs: Job[]; total: number; error: string | null }> {
    try {
      const {
        query = '',
        filters = {},
        page = 1,
        limit = 20,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = params

      let queryBuilder = supabase
        .from('jobs')
        .select(`
          *,
          companies (
            company_name,
            industry,
            logo_url,
            verified
          )
        `, { count: 'exact' })

      // 搜索条件
      if (query) {
        queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      }

      // 过滤条件
      if (filters.category) {
        queryBuilder = queryBuilder.eq('category', filters.category)
      }
      if (filters.job_type) {
        queryBuilder = queryBuilder.eq('job_type', filters.job_type)
      }
      if (filters.location) {
        queryBuilder = queryBuilder.ilike('work_location', `%${filters.location}%`)
      }
      if (filters.company_id) {
        queryBuilder = queryBuilder.eq('company_id', filters.company_id)
      }
      if (filters.status) {
        queryBuilder = queryBuilder.eq('status', filters.status)
      }

      // 排序和分页
      queryBuilder = queryBuilder
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range((page - 1) * limit, page * limit - 1)

      const { data, error, count } = await queryBuilder

      if (error) throw error

      return {
        jobs: data || [],
        total: count || 0,
        error: null
      }
    } catch (error: any) {
      return {
        jobs: [],
        total: 0,
        error: error.message || '获取职位列表失败'
      }
    }
  }

  // 获取职位详情
  static async getJobById(jobId: string): Promise<{ job: Job | null; error: string | null }> {
    try {
      const { data, error } = await supabase
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
            verified
          )
        `)
        .eq('id', jobId)
        .single()

      if (error) throw error

      // 增加浏览量
      await this.incrementViewCount(jobId)

      return {
        job: data,
        error: null
      }
    } catch (error: any) {
      return {
        job: null,
        error: error.message || '获取职位详情失败'
      }
    }
  }

  // 创建职位
  static async createJob(jobData: JobInsert): Promise<{ job: Job | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert(jobData)
        .select()
        .single()

      if (error) throw error

      return {
        job: data,
        error: null
      }
    } catch (error: any) {
      return {
        job: null,
        error: error.message || '创建职位失败'
      }
    }
  }

  // 更新职位
  static async updateJob(jobId: string, jobData: Partial<JobInsert>): Promise<{ job: Job | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .update(jobData)
        .eq('id', jobId)
        .select()
        .single()

      if (error) throw error

      return {
        job: data,
        error: null
      }
    } catch (error: any) {
      return {
        job: null,
        error: error.message || '更新职位失败'
      }
    }
  }

  // 删除职位
  static async deleteJob(jobId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)

      if (error) throw error

      return { error: null }
    } catch (error: any) {
      return { error: error.message || '删除职位失败' }
    }
  }

  // 获取企业职位列表
  static async getCompanyJobs(companyId: string): Promise<{ jobs: Job[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return {
        jobs: data || [],
        error: null
      }
    } catch (error: any) {
      return {
        jobs: [],
        error: error.message || '获取企业职位失败'
      }
    }
  }

  // 增加浏览量
  static async incrementViewCount(jobId: string): Promise<void> {
    try {
      await supabase.rpc('increment_views', { job_id: jobId })
    } catch (error) {
      console.error('增加浏览量失败:', error)
    }
  }

  // 获取热门职位
  static async getPopularJobs(limit: number = 10): Promise<{ jobs: Job[]; error: string | null }> {
    try {
      const { data, error } = await supabase
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
        .order('views_count', { ascending: false })
        .limit(limit)

      if (error) throw error

      return {
        jobs: data || [],
        error: null
      }
    } catch (error: any) {
      return {
        jobs: [],
        error: error.message || '获取热门职位失败'
      }
    }
  }

  // 获取职位分类
  static async getJobCategories(): Promise<{ categories: string[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('category')
        .not('category', 'is', null)

      if (error) throw error

      const categories = [...new Set(data?.map(job => job.category).filter(Boolean))] as string[]

      return {
        categories,
        error: null
      }
    } catch (error: any) {
      return {
        categories: [],
        error: error.message || '获取职位分类失败'
      }
    }
  }

  // 搜索职位建议
  static async getSearchSuggestions(query: string): Promise<{ suggestions: string[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('title')
        .ilike('title', `%${query}%`)
        .limit(10)

      if (error) throw error

      const suggestions = [...new Set(data?.map(job => job.title).filter(Boolean))] as string[]

      return {
        suggestions,
        error: null
      }
    } catch (error: any) {
      return {
        suggestions: [],
        error: error.message || '获取搜索建议失败'
      }
    }
  }
}