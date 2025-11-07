// 消息相关类型定义
export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  type: 'text' | 'image' | 'file' | 'system'
  file_url?: string
  file_name?: string
  file_size?: number
  created_at: string
  read: boolean
}

export interface Conversation {
  id: string
  user_id: string
  username: string
  avatar_url?: string
  last_message?: string
  last_message_time: string
  unread_count: number
  online: boolean
}

export interface MessageFilters {
  conversation_id?: string
  page?: number
  pageSize?: number
}

export interface SendMessageRequest {
  receiver_id: string
  content: string
  type?: 'text' | 'image' | 'file'
  file?: File
}