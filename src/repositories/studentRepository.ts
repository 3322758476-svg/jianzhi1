import { supabase } from '@/lib/supabase'
import type { Student, CreateStudent, UpdateStudent, StudentFilters } from '@/types/student'

export class StudentRepository {
  // 获取学生信息
  static async getStudentByUserId(userId: string): Promise<Student | null> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    return data
  }

  // 创建学生信息
  static async createStudent(student: CreateStudent): Promise<Student> {
    const { data, error } = await supabase
      .from('students')
      .insert(student)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // 更新学生信息
  static async updateStudent(userId: string, updates: UpdateStudent): Promise<Student> {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // 获取学生列表（企业查看）
  static async getStudents(filters: StudentFilters = {}): Promise<Student[]> {
    let query = supabase
      .from('students')
      .select('*')
    
    if (filters.school) {
      query = query.ilike('school', `%${filters.school}%`)
    }
    
    if (filters.major) {
      query = query.ilike('major', `%${filters.major}%`)
    }
    
    if (filters.grade) {
      query = query.eq('grade', filters.grade)
    }
    
    if (filters.skills && filters.skills.length > 0) {
      query = query.overlaps('skills', filters.skills)
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

  // 上传简历
  static async uploadResume(file: File, userId: string): Promise<string> {
    const fileName = `resumes/${userId}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage
      .from('documents')
      .upload(fileName, file)
    
    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName)
    
    return publicUrl
  }
}