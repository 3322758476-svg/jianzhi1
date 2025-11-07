// 通知相关类型定义
export interface Notification {
  id: string
  user_id: string
  type: 'system' | 'job' | 'application' | 'message' | 'security'
  title: string
  description: string
  related_id?: string
  important: boolean
  urgent: boolean
  created_at: string
  read: boolean
  starred: boolean
}

export interface NotificationFilters {
  type?: string
  status?: string
  dateRange?: [Date, Date]
  page?: number
  pageSize?: number
}

export interface NotificationStats {
  total: number
  unread: number
  today: number
}