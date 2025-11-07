import { supabase } from '@/lib/supabase'

export interface LoginCredentials {
  email: string
  password: string
  type: 'student' | 'company'
}

export interface RegisterData extends LoginCredentials {
  username: string
  confirmPassword: string
}

export interface UserProfile {
  id: string
  email: string
  username: string
  role: 'student' | 'company' | 'admin'
  avatar_url?: string
  created_at: string
}

export class AuthApi {
  // 用户登录
  static async login(credentials: LoginCredentials): Promise<{ user: UserProfile; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (error) throw error

      // 获取用户详细信息
      const userProfile = await this.getUserProfile(data.user.id)
      
      return {
        user: userProfile,
        error: null
      }
    } catch (error: any) {
      return {
        user: {} as UserProfile,
        error: error.message || '登录失败'
      }
    }
  }

  // 用户注册
  static async register(userData: RegisterData): Promise<{ user: UserProfile; error: string | null }> {
    try {
      // 验证密码匹配
      if (userData.password !== userData.confirmPassword) {
        throw new Error('密码不匹配')
      }

      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            username: userData.username,
            role: userData.type
          }
        }
      })

      if (error) throw error

      if (!data.user) {
        throw new Error('注册失败')
      }

      // 根据用户类型创建对应的资料
      if (userData.type === 'student') {
        await supabase.from('students').insert({
          user_id: data.user.id,
          real_name: userData.username
        })
      } else if (userData.type === 'company') {
        await supabase.from('companies').insert({
          user_id: data.user.id,
          company_name: userData.username
        })
      }

      const userProfile = await this.getUserProfile(data.user.id)
      
      return {
        user: userProfile,
        error: null
      }
    } catch (error: any) {
      return {
        user: {} as UserProfile,
        error: error.message || '注册失败'
      }
    }
  }

  // 获取当前用户信息
  static async getCurrentUser(): Promise<{ user: UserProfile | null; error: string | null }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) throw error
      if (!user) return { user: null, error: null }

      const userProfile = await this.getUserProfile(user.id)
      return { user: userProfile, error: null }
    } catch (error: any) {
      return { user: null, error: error.message || '获取用户信息失败' }
    }
  }

  // 获取用户详细资料
  static async getUserProfile(userId: string): Promise<UserProfile> {
    // 使用 profiles 表获取用户信息，而不是 admin API
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (profileError || !profileData) {
      throw new Error('用户档案不存在')
    }

    // 获取用户基本信息
    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData?.session?.user
    
    if (!user) {
      throw new Error('用户会话不存在')
    }

    const userMetadata = user.user_metadata
    
    return {
      id: user.id,
      email: user.email || '',
      username: userMetadata?.username || user.email?.split('@')[0] || '',
      role: userMetadata?.role || 'student',
      avatar_url: userMetadata?.avatar_url,
      created_at: user.created_at
    }
  }

  // 用户登出
  static async logout(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      return { error: null }
    } catch (error: any) {
      return { error: error.message || '登出失败' }
    }
  }

  // 重置密码
  static async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
      
      return { error: null }
    } catch (error: any) {
      return { error: error.message || '重置密码失败' }
    }
  }

  // 更新密码
  static async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      return { error: null }
    } catch (error: any) {
      return { error: error.message || '更新密码失败' }
    }
  }

  // 监听认证状态变化
  static onAuthStateChange(callback: (user: UserProfile | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userProfile = await this.getUserProfile(session.user.id)
        callback(userProfile)
      } else if (event === 'SIGNED_OUT') {
        callback(null)
      }
    })
  }
}