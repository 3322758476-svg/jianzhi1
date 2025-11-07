// 岗位相关类型定义

export interface Job {
  id: string
  company_id: string
  title: string
  description: string
  requirements?: string
  responsibilities?: string
  salary_range?: string
  work_location?: string
  work_hours?: string
  job_type: 'full_time' | 'part_time' | 'internship' | 'remote'
  category?: string
  skills_required?: string[]
  application_deadline?: string
  status: 'active' | 'inactive' | 'filled' | 'expired'
  views_count: number
  applications_count: number
  created_at: string
  updated_at: string
  company?: {
    company_name: string
    industry?: string
    logo_url?: string
  }
}

export interface CreateJob {
  company_id: string
  title: string
  description: string
  requirements?: string
  responsibilities?: string
  salary_range?: string
  work_location?: string
  work_hours?: string
  job_type: 'full_time' | 'part_time' | 'internship' | 'remote'
  category?: string
  skills_required?: string[]
  application_deadline?: string
}

export interface UpdateJob {
  title?: string
  description?: string
  requirements?: string
  responsibilities?: string
  salary_range?: string
  work_location?: string
  work_hours?: string
  job_type?: 'full_time' | 'part_time' | 'internship' | 'remote'
  category?: string
  skills_required?: string[]
  application_deadline?: string
  status?: 'active' | 'inactive' | 'filled' | 'expired'
}

export interface JobFilters {
  title?: string
  job_type?: string
  category?: string
  salary_min?: number
  salary_max?: number
  location?: string
  skills?: string[]
  company_id?: string
  status?: string
  page?: number
  pageSize?: number
}