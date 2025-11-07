import { supabase } from '@/lib/supabase'
import type { Company, CreateCompany, UpdateCompany } from '@/types/company'

export const companyRepository = {
  // 获取企业信息
  async getCompany(companyId: string): Promise<Company | null> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()
    
    if (error) throw error
    return data
  },

  // 创建企业信息
  async createCompany(companyData: CreateCompany): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .insert(companyData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 更新企业信息
  async updateCompany(companyId: string, updates: UpdateCompany): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', companyId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 获取企业发布的岗位
  async getCompanyJobs(companyId: string) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }
}