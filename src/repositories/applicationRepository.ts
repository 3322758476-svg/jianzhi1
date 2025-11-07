import { supabase } from '@/lib/supabase'
import type { Application, CreateApplication, UpdateApplication } from '@/types/application'

export const applicationRepository = {
  // 获取申请记录
  async getApplication(applicationId: string): Promise<Application | null> {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        jobs (*),
        students (*)
      `)
      .eq('id', applicationId)
      .single()
    
    if (error) throw error
    return data
  },

  // 创建申请
  async createApplication(applicationData: CreateApplication): Promise<Application> {
    const { data, error } = await supabase
      .from('applications')
      .insert(applicationData)
      .select(`
        *,
        jobs (*),
        students (*)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  // 更新申请状态
  async updateApplication(applicationId: string, updates: UpdateApplication): Promise<Application> {
    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', applicationId)
      .select(`
        *,
        jobs (*),
        students (*)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  // 获取学生的申请记录
  async getStudentApplications(studentId: string) {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        jobs (*)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // 获取企业的申请记录
  async getCompanyApplications(companyId: string) {
    // 使用正确的关联查询语法 - 先获取该企业的所有岗位ID
    const { data: companyJobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id')
      .eq('company_id', companyId)
    
    if (jobsError) throw jobsError
    
    const jobIds = companyJobs?.map(job => job.id) || []
    
    if (jobIds.length === 0) {
      return []
    }
    
    // 再查询这些岗位的申请
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        jobs (*),
        students (*)
      `)
      .in('job_id', jobIds)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }
}