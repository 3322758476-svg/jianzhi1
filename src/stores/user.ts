import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export interface User {
  id: string
  email: string
  username: string
  avatar?: string
  role: 'student' | 'company'
  created_at: string
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const loading = ref(false)

  // 初始化用户状态
  const initialize = async () => {
    loading.value = true
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // 获取用户信息 - 从用户元数据中获取
        const userMetadata = session.user.user_metadata
        const userRole = userMetadata?.role || 'student'
        
        // 根据用户角色获取详细信息
        let userDetails = {}
        if (userRole === 'company') {
          // 获取企业信息
          const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('user_id', session.user.id)
            .single()
          
          if (companyData) {
            userDetails = {
              companyId: companyData.id,
              companyName: companyData.company_name,
              industry: companyData.industry,
              logoUrl: companyData.logo_url
            }
          }
        } else if (userRole === 'student') {
          // 获取学生信息
          const { data: studentData } = await supabase
            .from('students')
            .select('*')
            .eq('user_id', session.user.id)
            .single()
          
          if (studentData) {
            userDetails = {
              studentId: studentData.id,
              realName: studentData.real_name,
              school: studentData.school,
              major: studentData.major
            }
          }
        }
        
        user.value = {
          id: session.user.id,
          email: session.user.email || '',
          username: userMetadata?.username || session.user.email?.split('@')[0] || '',
          avatar: userMetadata?.avatar_url,
          role: userRole,
          created_at: session.user.created_at,
          ...userDetails
        }
        isAuthenticated.value = true
      }
    } catch (error) {
      console.error('初始化用户状态失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 登录
  const login = async (email: string, password: string) => {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      if (data.user) {
        // 获取用户信息 - 从用户元数据中获取
        const userMetadata = data.user.user_metadata
        const userRole = userMetadata?.role || 'student'
        
        // 根据用户角色获取详细信息
        let userDetails = {}
        if (userRole === 'company') {
          // 获取企业信息
          const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('user_id', data.user.id)
            .single()
          
          if (companyData) {
            userDetails = {
              companyId: companyData.id,
              companyName: companyData.company_name,
              industry: companyData.industry,
              logoUrl: companyData.logo_url
            }
          }
        } else if (userRole === 'student') {
          // 获取学生信息
          const { data: studentData } = await supabase
            .from('students')
            .select('*')
            .eq('user_id', data.user.id)
            .single()
          
          if (studentData) {
            userDetails = {
              studentId: studentData.id,
              realName: studentData.real_name,
              school: studentData.school,
              major: studentData.major
            }
          }
        }
        
        user.value = {
          id: data.user.id,
          email: data.user.email || '',
          username: userMetadata?.username || data.user.email?.split('@')[0] || '',
          avatar: userMetadata?.avatar_url,
          role: userRole,
          created_at: data.user.created_at,
          ...userDetails
        }
        isAuthenticated.value = true
      }
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // 注册
  const register = async (email: string, password: string, username: string, role: 'student' | 'company') => {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            role
          }
        }
      })
      
      if (error) throw error
      
      return { success: true, user: data.user }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // 退出登录
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      user.value = null
      isAuthenticated.value = false
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // 监听认证状态变化
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      // 获取用户信息 - 从用户元数据中获取
      const userMetadata = session.user.user_metadata
      
      user.value = {
        id: session.user.id,
        email: session.user.email || '',
        username: userMetadata?.username || session.user.email?.split('@')[0] || '',
        avatar: userMetadata?.avatar_url,
        role: userMetadata?.role || 'student',
        created_at: session.user.created_at
      }
      isAuthenticated.value = true
    } else if (event === 'SIGNED_OUT') {
      user.value = null
      isAuthenticated.value = false
    }
  })

  return {
    user,
    isAuthenticated,
    loading,
    initialize,
    login,
    register,
    logout
  }
})