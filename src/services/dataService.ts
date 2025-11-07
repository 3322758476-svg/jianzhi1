import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Job = Database['public']['Tables']['jobs']['Row']
type Company = Database['public']['Tables']['companies']['Row']
type Application = Database['public']['Tables']['applications']['Row']
type Notification = Database['public']['Tables']['notifications']['Row']
type Message = Database['public']['Tables']['messages']['Row']

export interface JobWithCompany extends Job {
  companies: Pick<Company, 'company_name' | 'industry' | 'logo_url' | 'verified'>
}

export interface ApplicationWithJob extends Application {
  jobs: Pick<Job, 'title' | 'company_id'>
  companies: Pick<Company, 'company_name'>
}

export class DataService {
  // 获取首页推荐职位
  static async getFeaturedJobs(limit: number = 10): Promise<JobWithCompany[]> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          companies (
            company_name,
            industry,
            logo_url,
            verified
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取推荐职位失败:', error)
      return []
    }
  }

  // 获取所有职位列表
  static async getAllJobs(filters?: {
    category?: string
    job_type?: string
    location?: string
    query?: string
  }): Promise<JobWithCompany[]> {
    try {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          companies (
            company_name,
            industry,
            logo_url,
            verified
          )
        `)
        .eq('status', 'active')

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }
      if (filters?.job_type) {
        query = query.eq('job_type', filters.job_type)
      }
      if (filters?.location) {
        query = query.ilike('work_location', `%${filters.location}%`)
      }
      if (filters?.query) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取职位列表失败:', error)
      return []
    }
  }

  // 获取职位详情
  static async getJobDetail(jobId: string): Promise<JobWithCompany | null> {
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
      return data
    } catch (error) {
      console.error('获取职位详情失败:', error)
      return null
    }
  }

  // 获取用户申请记录
  static async getUserApplications(userId: string): Promise<ApplicationWithJob[]> {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            title,
            company_id
          ),
          companies (
            company_name
          )
        `)
        .eq('student_id', userId)
        .order('applied_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取申请记录失败:', error)
      return []
    }
  }

  // 获取公司职位列表
  static async getCompanyJobs(companyId: string): Promise<Job[]> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取公司职位失败:', error)
      return []
    }
  }

  // 获取公司申请记录
  static async getCompanyApplications(companyId: string): Promise<ApplicationWithJob[]> {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            title,
            company_id
          ),
          companies (
            company_name
          )
        `)
        .eq('jobs.company_id', companyId)
        .order('applied_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取公司申请记录失败:', error)
      return []
    }
  }

  // 获取用户通知
  static async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取通知失败:', error)
      return []
    }
  }

  // 获取用户消息
  static async getUserMessages(userId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('获取消息失败:', error)
      return []
    }
  }

  // 获取收藏的职位
  static async getFavoriteJobs(userId: string): Promise<JobWithCompany[]> {
    try {
      // 这里需要根据实际的收藏表结构来查询
      // 暂时返回空数组，需要先创建收藏表
      return []
    } catch (error) {
      console.error('获取收藏职位失败:', error)
      return []
    }
  }

  // 搜索职位
  static async searchJobs(keyword: string): Promise<JobWithCompany[]> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          companies (
            company_name,
            industry,
            logo_url,
            verified
          )
        `)
        .or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('搜索职位失败:', error)
      return []
    }
  }

  // 获取热门标签
  static async getPopularTags(): Promise<string[]> {
    try {
      // 从职位中提取热门标签
      const { data, error } = await supabase
        .from('jobs')
        .select('skills_required')
        .not('skills_required', 'is', null)

      if (error) throw error

      const allTags = data?.flatMap(job => job.skills_required || []) || []
      const tagCounts = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return Object.keys(tagCounts)
        .sort((a, b) => tagCounts[b] - tagCounts[a])
        .slice(0, 20)
    } catch (error) {
      console.error('获取热门标签失败:', error)
      return []
    }
  }
}