import { supabase } from '../lib/supabase'
import type { Message, Conversation, MessageFilters, SendMessageRequest } from '../types/message'

export const messageApi = {
  // 获取对话列表
  async getConversations(userId: string) {
    try {
      // 先检查conversations表是否存在
      try {
        // 使用新的对话表结构
        const { data: conversations, error: conversationsError } = await supabase
          .from('conversations')
          .select('*')
          .or(`student_id.eq.${userId},company_id.eq.${userId}`)
          .order('updated_at', { ascending: false })

        if (conversationsError) {
          console.warn('对话表查询失败，回退到空列表:', conversationsError.message)
          return [] as Conversation[] // 返回空列表
        }

        // 获取每个对话的最新消息和未读消息数
        const enrichedConversations = await Promise.all(
          (conversations || []).map(async (conversation) => {
            // 确定对方用户ID
            const otherUserId = conversation.student_id === userId ? conversation.company_id : conversation.student_id
            
            // 获取对方用户信息
            let username = '未知用户'
            let avatar_url = ''
            
            try {
              const { data: userData } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', otherUserId)
                .single()
              
              if (userData) {
                username = userData.username || '未知用户'
                avatar_url = userData.avatar_url || ''
              }
            } catch (error) {
              console.warn('获取用户信息失败:', error)
            }

            // 获取最新消息
            let last_message = ''
            let last_message_time = conversation.updated_at
            
            try {
              const { data: lastMessage } = await supabase
                .from('messages')
                .select('content, created_at')
                .eq('conversation_id', conversation.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()
              
              if (lastMessage) {
                last_message = lastMessage.content
                last_message_time = lastMessage.created_at
              }
            } catch (error) {
              console.warn('获取最新消息失败:', error)
            }

            // 获取未读消息数
            let unread_count = 0
            try {
              const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conversation.id)
                .eq('receiver_id', userId)
                .eq('is_read', false)
              
              unread_count = count || 0
            } catch (error) {
              console.warn('获取未读消息数失败:', error)
            }

            return {
              id: conversation.id,
              user_id: otherUserId,
              username: username,
              avatar_url: avatar_url,
              last_message: last_message,
              last_message_time: last_message_time,
              unread_count: unread_count,
              online: false // 这里可以集成实时在线状态
            }
          })
        )

        return enrichedConversations.filter(c => c.username !== '未知用户') as Conversation[]
      } catch (tableError) {
        console.warn('对话表操作异常，返回空列表:', tableError)
        return [] as Conversation[] // 返回空列表
      }
    } catch (error) {
      console.error('获取对话列表失败:', error)
      return [] as Conversation[] // 即使失败也返回空列表
    }
  },

  // 获取对话消息
  async getMessages(conversationId: string, currentUserId: string, filters?: MessageFilters) {
    // 如果conversationId是回退ID，则直接获取消息（不检查对话表）
    if (conversationId === 'fallback-conversation') {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('sender_id', currentUserId)
        .or(`receiver_id.eq.${currentUserId},sender_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false })

      if (filters?.page && filters?.pageSize) {
        const from = (filters.page - 1) * filters.pageSize
        const to = from + filters.pageSize - 1
        query = query.range(from, to)
      }

      const { data, error } = await query
      
      if (error) throw error
      
      // 处理消息数据，添加发送者信息
      const messages = (data || []).map(msg => ({
        ...msg,
        sender_name: msg.sender_id === currentUserId ? '我' : '对方',
        sender_avatar: '',
        receiver_name: msg.receiver_id === currentUserId ? '我' : '对方',
        sent_by_me: msg.sender_id === currentUserId
      }))
      
      return messages.reverse() as Message[]
    }

    // 否则使用对话表结构
    try {
      // 使用新的对话表结构
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (conversationError) {
        console.warn('对话表查询失败，回退到直接消息查询:', conversationError.message)
        // 回退到直接消息查询
        let query = supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
          .order('created_at', { ascending: false })

        if (filters?.page && filters?.pageSize) {
          const from = (filters.page - 1) * filters.pageSize
          const to = from + filters.pageSize - 1
          query = query.range(from, to)
        }

        const { data, error } = await query
        
        if (error) throw error
        
        // 处理消息数据，添加发送者信息
        const messages = (data || []).map(msg => ({
          ...msg,
          sender_name: msg.sender_id === currentUserId ? '我' : '对方',
          sender_avatar: '',
          receiver_name: msg.receiver_id === currentUserId ? '我' : '对方',
          sent_by_me: msg.sender_id === currentUserId
        }))
        
        return messages.reverse() as Message[]
      }

      if (!conversation) throw new Error('对话不存在')

      let query = supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })

      if (filters?.page && filters?.pageSize) {
        const from = (filters.page - 1) * filters.pageSize
        const to = from + filters.pageSize - 1
        query = query.range(from, to)
      }

      const { data, error } = await query
      
      if (error) throw error
      
      // 处理消息数据，添加发送者信息
      const messages = (data || []).map(msg => ({
        ...msg,
        sender_name: msg.sender_id === currentUserId ? '我' : '对方',
        sender_avatar: '',
        receiver_name: msg.receiver_id === currentUserId ? '我' : '对方',
        sent_by_me: msg.sender_id === currentUserId
      }))
      
      return messages.reverse() as Message[]
    } catch (error) {
      console.error('获取消息失败:', error)
      throw error
    }
  },

  // 发送消息
  async sendMessage(request: SendMessageRequest, senderId: string) {
    // 确保对话关系存在
    const conversationId = await this.ensureConversation(senderId, request.receiver_id)

    const messageData = {
      conversation_id: conversationId,
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

    return data as Message
  },

  // 确保对话关系存在
  async ensureConversation(user1Id: string, user2Id: string, jobId?: string): Promise<string> {
    try {
      // 简化逻辑：直接使用传入的用户ID创建对话
      
      // 首先检查conversations表是否存在
      try {
        // 检查是否已经存在对话
        const { data: existingConversations, error: queryError } = await supabase
          .from('conversations')
          .select('id')
          .or(`student_id.eq.${user1Id},company_id.eq.${user2Id},student_id.eq.${user2Id},company_id.eq.${user1Id}`)

        if (queryError) {
          // 如果查询失败，可能是因为表不存在或字段不存在，回退到使用旧的系统
          console.warn('对话表查询失败，回退到旧的消息系统:', queryError.message)
          return 'fallback-conversation' // 返回一个默认的对话ID
        }

        // 如果存在对话，返回第一个匹配的对话ID
        if (existingConversations && existingConversations.length > 0) {
          return existingConversations[0].id
        }

        // 创建新的对话 - 简化处理：让第一个用户作为学生，第二个用户作为企业
        const { data: newConversation, error: insertError } = await supabase
          .from('conversations')
          .insert([{
            student_id: user1Id,
            company_id: user2Id,
            job_id: jobId || null
          }])
          .select('id')
          .single()

        if (insertError) {
          console.warn('创建对话失败，回退到旧的消息系统:', insertError.message)
          return 'fallback-conversation' // 返回一个默认的对话ID
        }

        return newConversation.id
      } catch (tableError) {
        // 如果对话表操作失败，回退到使用旧的消息系统
        console.warn('对话表操作异常，回退到旧的消息系统:', tableError)
        return 'fallback-conversation' // 返回一个默认的对话ID
      }
    } catch (error) {
      console.error('确保对话关系失败:', error)
      // 即使失败也返回一个默认的对话ID，保证消息功能基本可用
      return 'fallback-conversation'
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
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', messageId)

    if (error) throw error
  },

  // 标记对话所有消息为已读
  async markConversationAsRead(conversationId: string, userId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', userId)
      .eq('is_read', false)

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