import { supabase } from '@/lib/supabase'
import type { Message, SendMessageRequest } from '@/types/message'

export class MessageRepository {
  // 获取用户消息列表
  static async getUserMessages(userId: string, page: number = 1, pageSize: number = 10): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(username, avatar_url),
        receiver:profiles!messages_receiver_id_fkey(username, avatar_url)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)
    
    if (error) throw error
    return data || []
  }

  // 获取未读消息数量
  static async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('read', false)
    
    if (error) throw error
    return count || 0
  }

  // 发送消息
  static async sendMessage(message: SendMessageRequest): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(username, avatar_url),
        receiver:profiles!messages_receiver_id_fkey(username, avatar_url)
      `)
      .single()
    
    if (error) throw error
    return data
  }

  // 标记消息为已读
  static async markAsRead(messageId: string): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId)
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(username, avatar_url),
        receiver:profiles!messages_receiver_id_fkey(username, avatar_url)
      `)
      .single()
    
    if (error) throw error
    return data
  }

  // 获取对话列表
  static async getConversations(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        title,
        content,
        read,
        important,
        created_at,
        sender:profiles!messages_sender_id_fkey(username, avatar_url),
        receiver:profiles!messages_receiver_id_fkey(username, avatar_url)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // 按对话对方分组，获取最新消息
    const conversations = new Map()
    data?.forEach(message => {
      const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id
      const otherUser = message.sender_id === userId ? message.receiver : message.sender
      
      if (!conversations.has(otherUserId) || 
          new Date(message.created_at) > new Date(conversations.get(otherUserId).created_at)) {
        conversations.set(otherUserId, {
          ...message,
          otherUser,
          unreadCount: 0 // 需要单独计算
        })
      }
    })
    
    return Array.from(conversations.values())
  }

  // 获取与特定用户的对话
  static async getConversationWithUser(userId: string, otherUserId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(username, avatar_url),
        receiver:profiles!messages_receiver_id_fkey(username, avatar_url)
      `)
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  // 删除消息
  static async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
    
    if (error) throw error
  }

  // 获取重要消息
  static async getImportantMessages(userId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(username, avatar_url),
        receiver:profiles!messages_receiver_id_fkey(username, avatar_url)
      `)
      .eq('receiver_id', userId)
      .eq('important', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }
}