// 申请相关类型定义

export interface Application {
  id: string
  job_id: string
  student_id: string
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'cancelled'
  cover_letter?: string
  resume_url?: string
  applied_at: string
  reviewed_at?: string
  feedback?: string
  rating?: number
  review_text?: string
  created_at: string
  updated_at: string
  job?: {
    title: string
    company_name: string
  }
  student?: {
    real_name?: string
    school?: string
    major?: string
  }
}

export interface CreateApplication {
  job_id: string
  student_id: string
  cover_letter?: string
  resume_url?: string
}

export interface UpdateApplication {
  status?: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'cancelled'
  feedback?: string
  rating?: number
  review_text?: string
}

export interface ApplicationFilters {
  job_id?: string
  student_id?: string
  status?: string
  page?: number
  pageSize?: number
}