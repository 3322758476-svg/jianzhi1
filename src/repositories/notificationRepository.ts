import { supabase } from '@/lib/supabase'
import type { Notification } from '@/types/notification'

// 创建通知的请求类型
export interface CreateNotification {
  user_id: string
  type: 'system' | 'job' | 'application' | 'message' | 'security'
  title: string
  description: string
  related_id?: string
  important?: boolean
  urgent?: boolean
}

export class NotificationRepository {
  // 获取用户通知列表
  static async getUserNotifications(userId: string, page: number = 1, pageSize: number = 10): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)
    
    if (error) throw error
    return data || []
  }

  // 获取未读通知数量
  static async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)
    
    if (error) throw error
    return count || 0
  }

  // 创建通知
  static async createNotification(notification: CreateNotification): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // 标记通知为已读
  static async markAsRead(notificationId: string): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // 标记所有通知为已读
  static async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    
    if (error) throw error
  }

  // 删除通知
  static async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
    
    if (error) throw error
  }

  // 获取重要通知
  static async getImportantNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('important', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  // 获取紧急通知
  static async getUrgentNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('urgent', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }
}