import { supabase } from '@/lib/supabase'
import type { Job, CreateJob, UpdateJob, JobFilters } from '@/types/job'

export class JobRepository {
  // 获取岗位列表
  static async getJobs(filters: JobFilters = {}): Promise<Job[]> {
    let query = supabase
      .from('jobs')
      .select(`
        *,
        company:companies(company_name, industry, logo_url)
      `)
    
    if (filters.title) {
      query = query.ilike('title', `%${filters.title}%`)
    }
    
    if (filters.job_type) {
      query = query.eq('job_type', filters.job_type)
    }
    
    if (filters.category) {
      query = query.ilike('category', `%${filters.category}%`)
    }
    
    if (filters.location) {
      query = query.ilike('work_location', `%${filters.location}%`)
    }
    
    if (filters.skills && filters.skills.length > 0) {
      query = query.overlaps('skills_required', filters.skills)
    }
    
    if (filters.company_id) {
      query = query.eq('company_id', filters.company_id)
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status)
    } else {
      query = query.eq('status', 'active')
    }
    
    const page = filters.page || 1
    const pageSize = filters.pageSize || 10
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(start, end)
    
    if (error) throw error
    return data || []
  }

  // 获取岗位详情
  static async getJobById(id: string): Promise<Job | null> {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  // 创建岗位
  static async createJob(job: CreateJob): Promise<Job> {
    const { data, error } = await supabase
      .from('jobs')
      .insert(job)
      .select(`
        *,
        company:companies(company_name, industry, logo_url)
      `)
      .single()
    
    if (error) throw error
    return data
  }

  // 更新岗位
  static async updateJob(id: string, updates: UpdateJob): Promise<Job> {
    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        company:companies(company_name, industry, logo_url)
      `)
      .single()
    
    if (error) throw error
    return data
  }

  // 删除岗位
  static async deleteJob(id: string): Promise<void> {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // 增加浏览量
  static async incrementViews(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_views', { job_id: id })
    if (error) throw error
  }

  // 获取企业发布的岗位
  static async getJobsByCompany(companyId: string): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }
}