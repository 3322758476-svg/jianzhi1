import { supabase } from '../lib/supabase'
import type { Message, Conversation, MessageFilters, SendMessageRequest } from '../types/message'

export const messageApi = {
  // 获取对话列表
  async getConversations(userId: string) {
    // 获取用户的所有联系人
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

    if (contactsError) throw contactsError

    // 获取每个联系人的最新消息和未读消息数
    const conversations = await Promise.all(
      contacts?.map(async (contact) => {
        const otherUserId = contact.user1_id === userId ? contact.user2_id : contact.user1_id
        
        // 获取用户信息
        const { data: userData } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', otherUserId)
          .single()

        // 获取最新消息
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // 获取未读消息数
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', userId)
          .eq('sender_id', otherUserId)
          .eq('read', false)

        return {
          id: contact.id,
          user_id: otherUserId,
          username: userData?.username || '未知用户',
          avatar_url: userData?.avatar_url,
          last_message: lastMessage?.content,
          last_message_time: lastMessage?.created_at || contact.last_activity,
          unread_count: unreadCount || 0,
          online: false // 这里可以集成实时在线状态
        }
      }) || []
    )

    return conversations.filter(c => c.username !== '未知用户') as Conversation[]
  },

  // 获取对话消息
  async getMessages(conversationId: string, filters?: MessageFilters) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (!contact) throw new Error('对话不存在')

    let query = supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${contact.user1_id},receiver_id.eq.${contact.user2_id}),and(sender_id.eq.${contact.user2_id},receiver_id.eq.${contact.user1_id})`)
      .order('created_at', { ascending: false })

    if (filters?.page && filters?.pageSize) {
      const from = (filters.page - 1) * filters.pageSize
      const to = from + filters.pageSize - 1
      query = query.range(from, to)
    }

    const { data, error } = await query
    
    if (error) throw error
    return data.reverse() as Message[]
  },

  // 发送消息
  async sendMessage(request: SendMessageRequest, senderId: string) {
    // 确保联系人关系存在
    await this.ensureContact(senderId, request.receiver_id)

    const messageData = {
      sender_id: senderId,
      receiver_id: request.receiver_id,
      content: request.content,
      type: request.type || 'text',
      file_url: request.file ? await this.uploadFile(request.file) : null,
      file_name: request.file?.name,
      file_size: request.file?.size
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select()
      .single()

    if (error) throw error

    // 更新联系人最后活动时间
    await supabase
      .from('contacts')
      .update({ last_activity: new Date().toISOString() })
      .or(`and(user1_id.eq.${senderId},user2_id.eq.${request.receiver_id}),and(user1_id.eq.${request.receiver_id},user2_id.eq.${senderId})`)

    return data as Message
  },

  // 确保联系人关系存在
  async ensureContact(user1Id: string, user2Id: string) {
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('*')
      .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
      .single()

    if (!existingContact) {
      const { error } = await supabase
        .from('contacts')
        .insert([{
          user1_id: user1Id,
          user2_id: user2Id
        }])

      if (error) throw error
    }
  },

  // 上传文件
  async uploadFile(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`

    const { error } = await supabase.storage
      .from('messages')
      .upload(fileName, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('messages')
      .getPublicUrl(fileName)

    return publicUrl
  },

  // 标记消息为已读
  async markAsRead(messageId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId)

    if (error) throw error
  },

  // 标记对话所有消息为已读
  async markConversationAsRead(conversationId: string, userId: string) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (!contact) throw new Error('对话不存在')

    const otherUserId = contact.user1_id === userId ? contact.user2_id : contact.user1_id

    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', otherUserId)
      .eq('receiver_id', userId)
      .eq('read', false)

    if (error) throw error
  },

  // 删除消息
  async deleteMessage(messageId: string) {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)

    if (error) throw error
  },

  // 订阅实时消息
  subscribeToMessages(userId: string, callback: (message: Message) => void) {
    return supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Message)
        }
      )
      .subscribe()
  }
}