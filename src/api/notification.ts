import { supabase } from '../lib/supabase'
import type { Notification, NotificationFilters } from '../types/notification'

export const notificationApi = {
  // 获取通知列表
  async getNotifications(userId: string, filters?: NotificationFilters) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (filters?.type && filters.type !== 'all') {
      query = query.eq('type', filters.type)
    }

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('read', filters.status === 'read')
    }

    if (filters?.dateRange && filters.dateRange.length === 2) {
      const [start, end] = filters.dateRange
      query = query
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
    }

    const { data, error } = await query
    
    if (error) throw error
    return data as Notification[]
  },

  // 获取通知统计
  async getNotificationStats(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const stats = {
      total: data?.length || 0,
      unread: data?.filter(n => !n.read).length || 0,
      today: data?.filter(n => new Date(n.created_at) >= today).length || 0
    }

    return stats
  },

  // 标记通知为已读
  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) throw error
  },

  // 标记所有通知为已读
  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) throw error
  },

  // 切换收藏状态
  async toggleStar(notificationId: string, starred: boolean) {
    const { error } = await supabase
      .from('notifications')
      .update({ starred })
      .eq('id', notificationId)

    if (error) throw error
  },

  // 删除通知
  async deleteNotification(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) throw error
  },

  // 清空所有通知
  async clearAll(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)

    if (error) throw error
  },

  // 订阅实时通知
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Notification)
        }
      )
      .subscribe()
  }
}