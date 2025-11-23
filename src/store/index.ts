import { defineStore } from 'pinia'
import { createClient } from '@supabase/supabase-js'

// 全局初始化 Supabase 客户端（避免重复创建）
declare global {
  interface Window {
    __supabase?: any;
  }
}

const supabase = window.__supabase || (window.__supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
))

export interface User {
  id: string
  username: string
  email: string
  role: 'student' | 'company'
  avatar?: string
  phone?: string
  school?: string
  major?: string
  companyName?: string
  license?: string
  contactPerson?: string
  contactPhone?: string
  registerTime?: string
  companyId?: string
  industry?: string
  logo?: string
  companyStatus?: string
  skills?: string[]
  education?: any[]
  experience?: any[]
  realName?: string
}

export interface Job {
  id: string
  title: string
  company: {
    name: string
    logo?: string
    industry: string
  }
  salary: string
  location: string
  workTime: string
  recruitCount: number
  description: string
  tags: string[]
  publishTime: string
}

export interface Application {
  id: string
  jobId: string
  userId: string
  resumeId: string
  message: string
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected'
  applyTime: string
}

export interface Message {
  id: string
  from: string
  to: string
  content: string
  time: string
  isOwn: boolean
  avatar?: string
}

export interface Rating {
  id: string
  from: string
  to: string
  score: number
  title: string
  comment: string
  tags: string[]
  time: string
  jobTitle: string
  anonymous: boolean
}

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    isLoading: false,
    error: null as string | null
  }),
  
  getters: {
    isStudent: (state) => state.user?.role === 'student',
    isCompany: (state) => state.user?.role === 'company',
    userInfo: (state) => state.user,
    authStatus: (state) => ({
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      error: state.error
    })
  },
  
  actions: {
    async initialize() {
      // 初始化时检查token有效性
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')
      
      if (token && userData) {
        this.token = token
        this.isAuthenticated = true
        this.user = JSON.parse(userData)
        
        // 验证token有效性
        await this.verifyToken()
      }
    },

    async verifyToken() {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error || !data.session) {
          // Token无效，清除登录状态
          this.logout()
          return false
        }
        
        // 同步用户信息
        await this.syncUserInfo()
        return true
      } catch (error) {
        console.error('验证token失败:', error)
        this.logout()
        return false
      }
    },

    async syncUserInfo() {
      if (!this.user) return
      
      try {
        // 从profiles表获取最新用户信息 - 使用正确的字段映射
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', this.user.id)  // 使用user_id而不是id
          .single()
        
        if (error) {
          console.warn('同步用户信息失败:', error)
          // 如果profiles表不存在或没有数据，使用默认用户信息
          return
        }
        
        if (data) {
          // 更新用户信息 - 使用profiles表的实际字段
          this.user = {
            ...this.user,
            username: data.username || this.user.username,
            email: data.email || this.user.email,
            role: data.role || this.user.role,
            avatar: data.avatar_url || this.user.avatar,
            phone: data.phone || this.user.phone,
            school: data.school || this.user.school,
            major: data.major || this.user.major,
            companyName: data.company_name || this.user.companyName,
            license: data.license || this.user.license,
            contactPerson: data.contact_person || this.user.contactPerson,
            contactPhone: data.contact_phone || this.user.contactPhone
          }
          
          localStorage.setItem('user', JSON.stringify(this.user))
        }
      } catch (error) {
        console.error('同步用户信息异常:', error)
      }
    },

    async login(credentials: { username: string; password: string; type: string }) {
      this.isLoading = true
      this.error = null
      
      try {
        console.log('🔍 开始登录流程...')
        console.log('账号:', credentials.username)
        console.log('类型:', credentials.type)
        
        // 检查 Supabase 连接
        if (!supabase) {
          throw new Error('数据库连接失败，请检查网络连接')
        }
        
        // 直接使用用户输入的账号作为邮箱
        // 避免自动添加域名导致邮箱不匹配
        const email = credentials.username
        
        console.log('使用的邮箱:', email)
        
        // 使用 Supabase 登录
        console.log('🔐 尝试登录 Supabase:', { email, password: credentials.password })
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: credentials.password
        })
        console.log('🔐 登录结果:', { data, error })
        
        if (error) {
          console.error('❌ Supabase登录错误:', error)
          
          // 特殊处理邮箱验证错误
          if (error.message?.includes('Email not confirmed')) {
            this.error = '邮箱未验证，请先验证邮箱后再登录'
            throw new Error('EMAIL_NOT_CONFIRMED')
          }
          
          this.error = error.message
          throw error
        }
        
        console.log('✅ Supabase登录成功')
        
        // 使用 profiles 表获取用户信息
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .maybeSingle()
        
        if (profileError || !profileData) {
          console.warn('⚠️ 获取用户档案失败，尝试创建新的用户档案:', profileError)
          
          let companyId = null
          
          // 根据用户类型创建对应的记录
          if (credentials.type === 'company') {
            console.log('🔧 为公司用户创建公司记录...')
            
            // 首先创建公司记录
            const { data: companyData, error: companyError } = await supabase
              .from('companies')
              .insert({
                user_id: data.user.id,
                company_name: data.user.user_metadata?.company_name || `${credentials.username}公司`,
                contact_person: data.user.user_metadata?.contact_person || credentials.username,
                contact_phone: data.user.user_metadata?.contact_phone || '',
                contact_email: data.user.email || email,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select('id')
              .single()
            
            if (companyError) {
              console.warn('⚠️ 创建公司记录失败:', companyError)
            } else {
              companyId = companyData.id
              console.log('✅ 成功创建公司记录，公司ID:', companyId)
            }
          } else if (credentials.type === 'student') {
            console.log('🔧 为学生用户创建学生记录...')
            
            // 创建学生记录
            const { data: studentData, error: studentError } = await supabase
              .from('students')
              .insert({
                user_id: data.user.id,
                real_name: data.user.user_metadata?.name || credentials.username,
                student_id: data.user.user_metadata?.student_id || `S${Date.now()}`,
                school: data.user.user_metadata?.school || '未知学校',
                major: data.user.user_metadata?.major || '未知专业',
                phone: data.user.user_metadata?.phone || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select('id')
              .single()
            
            if (studentError) {
              console.warn('⚠️ 创建学生记录失败:', studentError)
            } else {
              console.log('✅ 成功创建学生记录，学生ID:', studentData.id)
            }
          }
          
          // 创建用户档案
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              user_id: data.user.id,
              role: credentials.type,
              company_id: companyId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          
          if (createError) {
            console.warn('⚠️ 创建用户档案失败，使用默认信息:', createError)
          } else {
            console.log('✅ 成功创建用户档案')
          }
          
          // 使用默认信息
          this.user = {
            id: data.user.id,
            username: data.user.user_metadata?.username || data.user.email?.split('@')[0] || data.user.user_metadata?.name || data.user.user_metadata?.companyName || data.user.email?.split('@')[0] || '用户',
            email: data.user.email || email,
            role: credentials.type,
            avatar: data.user.user_metadata?.avatar || '',
            phone: data.user.user_metadata?.phone || '',
            school: data.user.user_metadata?.school || '',
            major: data.user.user_metadata?.major || '',
            companyName: data.user.user_metadata?.company_name || `${data.user.user_metadata?.username || data.user.email?.split('@')[0] || '公司'}公司`,
            license: data.user.user_metadata?.license || '',
            contactPerson: data.user.user_metadata?.contact_person || data.user.user_metadata?.username || data.user.email?.split('@')[0] || '联系人',
            contactPhone: data.user.user_metadata?.contact_phone || '',
            registerTime: data.user.created_at || new Date().toISOString()
          }
        } else {
          // 使用获取到的用户信息
          const userMetadata = data.user.user_metadata
          this.user = {
            id: data.user.id,
            username: userMetadata?.username || data.user.email?.split('@')[0] || data.user.user_metadata?.username || '用户',
            email: data.user.email || email,
            role: profileData.role || data.user.user_metadata?.role || 'student',
            avatar: userMetadata?.avatar || '',
            phone: userMetadata?.phone || '',
            school: userMetadata?.school || '',
            major: userMetadata?.major || '',
            companyName: userMetadata?.company_name || '',
            license: userMetadata?.license || '',
            contactPerson: userMetadata?.contact_person || '',
            contactPhone: data.user.user_metadata?.contact_phone || '',
            registerTime: data.user.created_at || new Date().toISOString()
          }
        }
        
        this.token = data.session.access_token
        this.isAuthenticated = true
        
        // 保存到localStorage
        localStorage.setItem('token', data.session.access_token)
        localStorage.setItem('user', JSON.stringify(this.user))
        
        console.log('✅ 登录完成，用户信息:', this.user)
        
        return { success: true, user: this.user }
      } catch (error) {
        console.error('❌ 登录失败:', error)
        
        // 特殊处理邮箱验证错误
        if (error.message === 'EMAIL_NOT_CONFIRMED') {
          this.error = '邮箱未验证，请先验证邮箱后再登录'
        } else {
          this.error = '登录失败，请检查账号和密码'
        }
        
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async register(userData: any) {
      this.isLoading = true
      this.error = null
      
      try {
        // 使用 Supabase 注册
        const { data, error } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              username: userData.name || userData.companyName || userData.email.split('@')[0],
              role: userData.userType,
              phone: userData.contactPhone || '',
              school: userData.school || '',
              major: userData.major || '',
              company_name: userData.companyName || '',
              license: userData.license || '',
              contact_person: userData.contactPerson || '',
              contact_phone: userData.contactPhone || ''
            }
          }
        })
        
        if (error) {
          this.error = error.message
          throw error
        }
        
        console.log('✅ 用户注册成功')
        
        // 如果注册时自动登录（session存在），则直接设置用户状态
        if (data.session) {
          this.user = {
            id: data.user.id,
            username: data.user.user_metadata?.username || data.user.email?.split('@')[0] || data.user.user_metadata?.name || data.user.user_metadata?.companyName || data.user.email?.split('@')[0] || '用户',
            email: data.user.email,
            role: data.user.user_metadata.role,
            avatar: '',
            phone: data.user.user_metadata.phone || '',
            school: data.user.user_metadata.school || '',
            major: data.user.user_metadata.major || '',
            companyName: data.user.user_metadata.company_name || '',
            license: data.user.user_metadata.license || '',
            contactPerson: data.user.user_metadata.contact_person || '',
            contactPhone: data.user.user_metadata.contact_phone || '',
            registerTime: new Date().toISOString()
          }
          
          this.token = data.session.access_token
          this.isAuthenticated = true
          
          // 保存到localStorage
          localStorage.setItem('token', data.session.access_token)
          localStorage.setItem('user', JSON.stringify(this.user))
          
          console.log('✅ 注册时自动登录成功')
        } else {
          console.log('⚠️ 需要邮箱验证后才能登录')
          // 注册成功但需要邮箱验证，不设置登录状态
          this.user = null
          this.token = null
          this.isAuthenticated = false
        }
        
        return { 
          success: true, 
          user: this.user,
          requiresEmailConfirmation: !data.session 
        }
      } catch (error) {
        this.error = '注册失败，请稍后重试'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      this.isLoading = true
      
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 清除状态
        this.user = null
        this.token = null
        this.isAuthenticated = false
        this.error = null
        
        // 清除localStorage
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        
        return { success: true }
      } catch (error) {
        this.error = '退出登录失败'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateProfile(profileData: Partial<User>) {
      this.isLoading = true
      this.error = null
      
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 800))
        
        if (this.user) {
          this.user = { ...this.user, ...profileData }
          localStorage.setItem('user', JSON.stringify(this.user))
        }
        
        return { success: true, user: this.user }
      } catch (error) {
        this.error = '更新资料失败'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async changePassword(passwordData: {
      currentPassword: string
      newPassword: string
    }) {
      this.isLoading = true
      this.error = null
      
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // 这里可以添加实际的密码修改逻辑
        // 暂时使用参数避免未使用警告
        console.log('修改密码:', passwordData.currentPassword, passwordData.newPassword)
        
        return { success: true }
      } catch (error) {
        this.error = '修改密码失败'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    clearError() {
      this.error = null
    }
  }
})

export const useJobStore = defineStore('job', {
  state: () => ({
    jobs: [] as Job[],
    favorites: [] as string[],
    applications: [] as Application[],
    isLoading: false
  }),
  
  getters: {
    favoriteJobs: (state) => 
      state.jobs.filter(job => state.favorites.includes(job.id)),
    appliedJobs: (state) => 
      state.jobs.filter(job => 
        state.applications.some(app => app.jobId === job.id)
      ),
    jobCount: (state) => state.jobs.length
  },
  
  actions: {
    async fetchJobs(filters?: any) {
      this.isLoading = true
      
      try {
        // 从 Supabase 获取岗位数据
        let query = supabase
          .from('jobs')
          .select(`
            id,
            title,
            salary_range,
            work_location,
            work_hours,
            recruit_count,
            description,
            created_at,
            status,
            skills_required,
            companies (name, logo, industry)
          `)
          .order('created_at', { ascending: false })
        
        // 应用筛选条件（如果提供）
        if (filters) {
          if (filters.location) {
            query = query.ilike('work_location', `%${filters.location}%`)
          }
          if (filters.salary) {
            query = query.gte('salary_range', filters.salary.min)
            query = query.lte('salary_range', filters.salary.max)
          }
          if (filters.keyword) {
            query = query.or(
              `title.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%`
            )
          }
        }
        
        const { data, error } = await query
        
        if (error) {
          throw error
        }
        
        // 格式化数据
        this.jobs = data.map(job => ({
          id: job.id,
          title: job.title,
          salary: job.salary_range,
          location: job.work_location,
          workTime: job.work_hours,
          recruitCount: job.recruit_count,
          description: job.description,
          publishTime: job.created_at,
          company: {
            name: job.companies?.name || '未知公司',
            logo: job.companies?.logo || '',
            industry: job.companies?.industry || '未知行业'
          },
          tags: job.skills_required || []
        }))
        
        return this.jobs
      } catch (error) {
        console.error('获取岗位列表失败:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async applyJob(jobId: string, resumeId: string, message?: string) {
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const application: Application = {
          id: Date.now().toString(),
          jobId,
          userId: '1', // 从store获取当前用户ID
          resumeId,
          message: message || '',
          status: 'pending',
          applyTime: new Date().toISOString()
        }
        
        this.applications.push(application)
        return { success: true, application }
      } catch (error) {
        console.error('申请岗位失败:', error)
        throw error
      }
    },

    toggleFavorite(jobId: string) {
      const index = this.favorites.indexOf(jobId)
      if (index > -1) {
        this.favorites.splice(index, 1)
      } else {
        this.favorites.push(jobId)
      }
    }
  }
})

export const useMessageStore = defineStore('message', {
  state: () => ({
    conversations: [] as any[],
    currentConversation: null as any,
    messages: [] as Message[],
    unreadCount: 0
  }),
  
  actions: {
    async sendMessage(to: string, content: string) {
      try {
        const message: Message = {
          id: Date.now().toString(),
          from: '1', // 当前用户ID
          to,
          content,
          time: new Date().toLocaleTimeString('zh-CN'),
          isOwn: true
        }
        
        this.messages.push(message)
        return message
      } catch (error) {
        console.error('发送消息失败:', error)
        throw error
      }
    }
  }
})

export const useRatingStore = defineStore('rating', {
  state: () => ({
    ratings: [] as Rating[],
    givenRatings: [] as Rating[],
    receivedRatings: [] as Rating[],
    pendingRatings: [] as any[]
  }),
  
  actions: {
    async submitRating(ratingData: Omit<Rating, 'id' | 'from' | 'time'>) {
      try {
        const rating: Rating = {
          id: Date.now().toString(),
          from: '1', // 当前用户ID
          to: ratingData.to,
          score: ratingData.score,
          title: ratingData.title,
          comment: ratingData.comment,
          tags: ratingData.tags,
          time: new Date().toISOString(),
          jobTitle: ratingData.jobTitle,
          anonymous: ratingData.anonymous
        }
        
        this.ratings.push(rating)
        this.givenRatings.push(rating)
        return rating
      } catch (error) {
        console.error('提交评价失败:', error)
        throw error
      }
    }
  }
})