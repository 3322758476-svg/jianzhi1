// 企业相关类型定义

export interface Company {
  id: string
  user_id: string
  company_name: string
  business_license?: string
  industry?: string
  scale?: string
  address?: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  description?: string
  logo_url?: string
  verified: boolean
  created_at: string
  updated_at: string
}

export interface CreateCompany {
  user_id: string
  company_name: string
  business_license?: string
  industry?: string
  scale?: string
  address?: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  description?: string
  logo_url?: string
}

export interface UpdateCompany {
  company_name?: string
  business_license?: string
  industry?: string
  scale?: string
  address?: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  description?: string
  logo_url?: string
}

export interface CompanyFilters {
  industry?: string
  scale?: string
  verified?: boolean
  page?: number
  pageSize?: number
}