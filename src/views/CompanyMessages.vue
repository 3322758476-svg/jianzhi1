<template>
  <div class="company-messages">
    <div class="page-header">
      <h1>消息中心</h1>
      <p>管理您的企业消息和通知</p>
    </div>

    <div class="messages-container">
      <!-- 侧边栏 - 对话列表 -->
      <div class="conversations-sidebar">
        <div class="sidebar-header">
          <h3>对话列表</h3>
          <el-button type="primary" size="small" @click="startNewConversation">
            新对话
          </el-button>
        </div>
        
        <div class="search-container">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索对话"
            prefix-icon="Search"
            clearable
            size="small"
          />
        </div>
        
        <div class="conversations-list">
          <div v-if="loading" class="loading-container">
            <el-skeleton :rows="5" animated />
          </div>
          
          <div v-else-if="filteredConversations.length === 0" class="empty-state">
            <el-empty description="暂无对话" />
          </div>
          
          <div v-else class="conversations">
            <div 
              v-for="conversation in filteredConversations" 
              :key="conversation.id"
              class="conversation-item"
              :class="{ active: activeConversation?.id === conversation.id }"
              @click="selectConversation(conversation)"
            >
              <div class="conversation-avatar">
                <el-avatar :size="40" :src="conversation.avatar">
                  {{ conversation.name?.charAt(0) }}
                </el-avatar>
                <div v-if="conversation.unreadCount > 0" class="unread-dot"></div>
              </div>
              <div class="conversation-info">
                <div class="conversation-header">
                  <span class="conversation-name">{{ conversation.name }}</span>
                  <span class="conversation-time">{{ formatTime(conversation.lastMessageTime) }}</span>
                </div>
                <div class="conversation-preview">
                  {{ conversation.lastMessage }}
                </div>
              </div>
              <div v-if="conversation.unreadCount > 0" class="unread-badge">
                {{ conversation.unreadCount }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 主内容区 - 聊天窗口 -->
      <div class="chat-container">
        <div v-if="!activeConversation" class="no-conversation-selected">
          <el-empty description="请选择一个对话开始聊天" />
        </div>
        
        <div v-else class="chat-window">
          <!-- 聊天头部 -->
          <div class="chat-header">
            <div class="chat-user-info">
              <el-avatar :size="40" :src="activeConversation.avatar">
                {{ activeConversation.name?.charAt(0) }}
              </el-avatar>
              <div class="user-details">
                <div class="user-name">{{ activeConversation.name }}</div>
                <div class="user-status">在线</div>
              </div>
            </div>
            <div class="chat-actions">
              <el-button type="text" @click="refreshConversation">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
              <el-button type="text" @click="markConversationAsRead">
                <el-icon><Check /></el-icon>
                标记已读
              </el-button>
            </div>
          </div>
          
          <!-- 消息列表 -->
          <div class="messages-area">
            <div v-if="conversationLoading" class="loading-container">
              <el-skeleton :rows="5" animated />
            </div>
            
            <div v-else-if="conversationMessages.length === 0" class="empty-state">
              <el-empty description="暂无消息" />
            </div>
            
            <div v-else class="messages-list">
              <div 
                v-for="message in conversationMessages" 
                :key="message.id"
                class="message-item"
                :class="{ 'own-message': message.isOwn }"
              >
                <div class="message-avatar">
                  <el-avatar :size="32" :src="message.avatar">
                    {{ message.sender?.charAt(0) }}
                  </el-avatar>
                </div>
                <div class="message-content">
                  <div class="message-text">{{ message.content }}</div>
                  <div class="message-time">{{ formatTime(message.time) }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 消息输入框 -->
          <div class="message-input-area">
            <div class="input-container">
              <el-input
                v-model="newMessage"
                placeholder="输入消息内容..."
                type="textarea"
                :rows="2"
                resize="none"
                @keyup.enter="sendMessage"
              />
              <div class="input-actions">
                <el-button type="text" @click="attachFile">
                  <el-icon><Paperclip /></el-icon>
                </el-button>
                <el-button type="primary" @click="sendMessage">
                  <el-icon><Promotion /></el-icon>
                  发送
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新对话对话框 -->
    <el-dialog v-model="showNewConversationDialog" title="开始新对话" width="500px">
      <div class="new-conversation-dialog">
        <el-form :model="newConversationForm" label-width="80px">
          <el-form-item label="收件人">
            <el-select v-model="newConversationForm.recipient" placeholder="选择收件人" style="width: 100%">
              <el-option label="学生A" value="student1" />
              <el-option label="学生B" value="student2" />
              <el-option label="学生C" value="student3" />
            </el-select>
          </el-form-item>
          <el-form-item label="消息内容">
            <el-input v-model="newConversationForm.content" type="textarea" :rows="4" />
          </el-form-item>
        </el-form>
        <div class="dialog-actions">
          <el-button @click="showNewConversationDialog = false">取消</el-button>
          <el-button type="primary" @click="createNewConversation">发送</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Check, Search, Promotion, Paperclip } from '@element-plus/icons-vue'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/store'

interface Conversation {
  id: string
  name: string
  avatar: string
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
  partnerId: string
}

interface ChatMessage {
  id: string
  sender: string
  avatar: string
  content: string
  time: Date
  isOwn: boolean
}

const userStore = useUserStore()

// 对话相关数据
const conversations = ref<Conversation[]>([])
const activeConversation = ref<Conversation | null>(null)
const conversationMessages = ref<ChatMessage[]>([])
const loading = ref(false)
const conversationLoading = ref(false)
const searchKeyword = ref('')
const newMessage = ref('')

// 新对话对话框
const showNewConversationDialog = ref(false)
const newConversationForm = ref({
  recipient: '',
  content: ''
})

// 计算属性 - 过滤对话列表
const filteredConversations = computed(() => {
  if (!searchKeyword.value) return conversations.value
  return conversations.value.filter(conv => 
    conv.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 从数据库加载对话列表
const loadConversations = async () => {
  if (!userStore.user?.id) return
  
  loading.value = true
  try {
    // 获取当前用户的所有对话伙伴
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userStore.user.id},receiver_id.eq.${userStore.user.id}`)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // 提取所有对话伙伴
    const partners = new Map()
    
    for (const msg of messages || []) {
      const partnerId = msg.sender_id === userStore.user.id ? msg.receiver_id : msg.sender_id
      
      if (!partners.has(partnerId)) {
        let partnerName = `用户${partnerId.substring(0, 8)}`
        
        // 尝试获取伙伴信息（主要是学生）
        try {
          const { data: studentData } = await supabase
            .from('students')
            .select('name')
            .eq('user_id', partnerId)
            .maybeSingle()
          
          if (studentData) {
            partnerName = studentData.name
          }
        } catch (error) {
          console.warn('获取学生信息失败:', error)
        }
        
        // 计算未读消息数量
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', userStore.user.id)
          .eq('sender_id', partnerId)
          .eq('read', false)
        
        partners.set(partnerId, {
          id: partnerId,
          name: partnerName,
          avatar: '',
          lastMessage: msg.content,
          lastMessageTime: new Date(msg.created_at),
          unreadCount: unreadCount || 0,
          partnerId: partnerId
        })
      }
    }
    
    conversations.value = Array.from(partners.values())
    
  } catch (error) {
    console.error('加载对话列表失败:', error)
    ElMessage.error('加载对话列表失败')
  } finally {
    loading.value = false
  }
}

// 从数据库加载特定对话的消息
const loadConversationMessages = async (partnerId: string) => {
  if (!userStore.user?.id) return
  
  conversationLoading.value = true
  try {
    // 获取与特定伙伴的对话消息
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userStore.user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userStore.user.id})`)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    // 转换消息数据
    conversationMessages.value = []
    
    for (const msg of messages || []) {
      let senderName = `用户${msg.sender_id.substring(0, 8)}`
      
      // 获取发送者信息
      try {
        // 首先尝试从用户元数据中获取用户名
        const { data: userData } = await supabase
          .from('auth.users')
          .select('email, user_metadata')
          .eq('id', msg.sender_id)
          .maybeSingle()
        
        if (userData) {
          // 优先使用用户元数据中的用户名，其次使用邮箱前缀
          senderName = userData.user_metadata?.username || userData.email?.split('@')[0] || `用户${msg.sender_id.substring(0, 8)}`
        }
        
        // 如果用户元数据中没有用户名，再尝试从学生表中获取
        if (!userData || !userData.user_metadata?.username) {
          const { data: studentData } = await supabase
            .from('students')
            .select('real_name')
            .eq('user_id', msg.sender_id)
            .maybeSingle()
          
          if (studentData?.real_name) {
            senderName = studentData.real_name
          }
        }
      } catch (error) {
        console.warn('获取发送者信息失败:', error)
      }
      
      conversationMessages.value.push({
        id: msg.id,
        sender: msg.sender_id === userStore.user.id ? '我' : senderName,
        avatar: '',
        content: msg.content,
        time: new Date(msg.created_at),
        isOwn: msg.sender_id === userStore.user.id
      })
    }
    
    // 标记为已读
    await markConversationAsRead(partnerId)
    
  } catch (error) {
    console.error('加载对话消息失败:', error)
    ElMessage.error('加载对话消息失败')
  } finally {
    conversationLoading.value = false
  }
}

// 发送消息
const sendMessage = async () => {
  if (!newMessage.value.trim()) {
    ElMessage.warning('请输入消息内容')
    return
  }
  
  if (!activeConversation.value || !userStore.user?.id) {
    ElMessage.error('请先选择对话')
    return
  }
  
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: userStore.user.id,
        receiver_id: activeConversation.value.partnerId,
        content: newMessage.value.trim(),
        type: 'text'
      })
      .select()
    
    if (error) throw error
    
    if (data && data[0]) {
      // 添加到本地消息列表
      const message: ChatMessage = {
        id: data[0].id,
        sender: '我',
        avatar: '',
        content: newMessage.value.trim(),
        time: new Date(data[0].created_at),
        isOwn: true
      }
      
      conversationMessages.value.push(message)
      newMessage.value = ''
      
      // 更新对话列表中的最后消息
      const conversation = conversations.value.find(c => c.id === activeConversation.value?.id)
      if (conversation) {
        conversation.lastMessage = message.content
        conversation.lastMessageTime = message.time
      }
      
      ElMessage.success('消息发送成功')
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败')
  }
}

// 标记对话为已读
const markConversationAsRead = async (partnerId?: string) => {
  if (!userStore.user?.id) return
  
  const targetPartnerId = partnerId || activeConversation.value?.partnerId
  if (!targetPartnerId) return
  
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('receiver_id', userStore.user.id)
      .eq('sender_id', targetPartnerId)
      .eq('read', false)
    
    if (error) throw error
    
    // 更新本地状态
    const conversation = conversations.value.find(c => c.partnerId === targetPartnerId)
    if (conversation) {
      conversation.unreadCount = 0
    }
    
    ElMessage.success('标记为已读成功')
  } catch (error) {
    console.error('标记对话为已读失败:', error)
  }
}

// 选择对话
const selectConversation = (conversation: Conversation) => {
  activeConversation.value = conversation
  // 加载对话消息
  loadConversationMessages(conversation.partnerId)
}

// 刷新对话
const refreshConversation = () => {
  if (activeConversation.value) {
    loadConversationMessages(activeConversation.value.partnerId)
  }
}

// 开始新对话
const startNewConversation = () => {
  showNewConversationDialog.value = true
}

// 创建新对话
const createNewConversation = async () => {
  if (!newConversationForm.value.recipient || !newConversationForm.value.content) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  try {
    // 这里需要根据收件人选择获取实际的用户ID
    // 暂时使用模拟数据
    const partnerId = 'mock-student-id'
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: userStore.user?.id,
        receiver_id: partnerId,
        content: newConversationForm.value.content,
        type: 'text'
      })
      .select()
    
    if (error) throw error
    
    ElMessage.success('消息发送成功')
    showNewConversationDialog.value = false
    newConversationForm.value = { recipient: '', content: '' }
    
    // 刷新对话列表
    loadConversations()
  } catch (error) {
    console.error('创建新对话失败:', error)
    ElMessage.error('创建新对话失败')
  }
}

// 附件功能（占位）
const attachFile = () => {
  ElMessage.info('附件功能开发中')
}

// 格式化时间
const formatTime = (time: Date) => {
  const now = new Date()
  const diff = now.getTime() - time.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return time.toLocaleDateString()
}

// 生命周期
onMounted(() => {
  loadConversations()
})
</script>

<style scoped>
@import '@/assets/styles/common.css';
.company-messages {
  padding: 20px;
  height: 100vh;
  background: #f5f7fa;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  color: #303133;
  margin: 0;
}

.page-header p {
  color: #909399;
  margin: 5px 0 0 0;
}

.messages-container {
  display: flex;
  height: calc(100vh - 100px);
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.messages-sidebar {
  width: 300px;
  border-right: 1px solid #e4e7ed;
  padding: 20px;
}

.messages-filter {
  margin-bottom: 20px;
}

.message-categories {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.category-item:hover {
  background-color: #f5f7fa;
}

.category-item.active {
  background-color: #ecf5ff;
  color: #409eff;
}

.category-item .el-icon {
  margin-right: 12px;
  font-size: 16px;
}

.category-badge {
  margin-left: auto;
}

.messages-content {
  flex: 1;
  display: flex;
}

.messages-list {
  width: 400px;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
}

.message-item {
  display: flex;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.message-item:hover {
  background-color: #f5f7fa;
}

.message-item.unread {
  background-color: #f0f9ff;
}

.message-avatar {
  margin-right: 12px;
}

.message-info {
  flex: 1;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.message-sender {
  font-weight: 600;
  color: #303133;
}

.message-time {
  font-size: 12px;
  color: #909399;
}

.message-preview {
  font-size: 14px;
  color: #606266;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.message-detail {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
  height: 100%;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.detail-header h3 {
  margin: 0;
  color: #303133;
}

.detail-actions {
  display: flex;
  gap: 8px;
}

.message-meta {
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 6px;
}

.meta-item {
  display: flex;
  margin-bottom: 8px;
}

.meta-item:last-child {
  margin-bottom: 0;
}

.meta-label {
  width: 60px;
  color: #909399;
}

.meta-value {
  color: #303133;
}

.message-content {
  line-height: 1.6;
  color: #606266;
  white-space: pre-wrap;
}
</style>