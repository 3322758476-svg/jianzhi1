import { createClient } from '@supabase/supabase-js'

// 从环境变量获取配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// 导出类型
export type { User } from '@supabase/supabase-js'

// 数据库类型（需要从 Supabase 生成）
export type Database = {
  public: {
    Tables: {
      jobs: {
        Row: any
        Insert: any
        Update: any
      }
      applications: {
        Row: any
        Insert: any
        Update: any
      }
      companies: {
        Row: any
        Insert: any
        Update: any
      }
      profiles: {
        Row: any
        Insert: any
        Update: any
      }
      notifications: {
        Row: any
        Insert: any
        Update: any
      }
      messages: {
        Row: any
        Insert: any
        Update: any
      }
    }
  }
}