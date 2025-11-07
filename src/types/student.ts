// 学生相关类型定义

export interface Student {
  id: string
  user_id: string
  student_id?: string
  real_name?: string
  school?: string
  major?: string
  grade?: string
  phone?: string
  skills?: string[]
  experience?: string
  expected_salary?: string
  preferred_locations?: string[]
  preferred_job_types?: string[]
  resume_url?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface CreateStudent {
  user_id: string
  student_id?: string
  real_name?: string
  school?: string
  major?: string
  grade?: string
  phone?: string
  skills?: string[]
  experience?: string
  expected_salary?: string
  preferred_locations?: string[]
  preferred_job_types?: string[]
  resume_url?: string
  avatar_url?: string
}

export interface UpdateStudent {
  student_id?: string
  real_name?: string
  school?: string
  major?: string
  grade?: string
  phone?: string
  skills?: string[]
  experience?: string
  expected_salary?: string
  preferred_locations?: string[]
  preferred_job_types?: string[]
  resume_url?: string
  avatar_url?: string
}

export interface StudentFilters {
  school?: string
  major?: string
  grade?: string
  skills?: string[]
  page?: number
  pageSize?: number
}