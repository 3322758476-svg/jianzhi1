<template>
  <div class="student-messages-page">
    <div class="page-header">
      <h2>我的消息</h2>
      <p>查看和管理您与企业之间的沟通记录</p>
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
              <el-option label="企业A" value="company1" />
              <el-option label="企业B" value="company2" />
              <el-option label="企业C" value="company3" />
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
        
        // 尝试获取伙伴信息
        try {
          const { data: companyData } = await supabase
            .from('companies')
            .select('company_name')
            .eq('user_id', partnerId)
            .maybeSingle()
          
          if (companyData) {
            partnerName = companyData.company_name
          } else {
            const { data: studentData } = await supabase
              .from('students')
              .select('name')
              .eq('user_id', partnerId)
              .maybeSingle()
            
            if (studentData) {
              partnerName = studentData.name
            }
          }
        } catch (error) {
          console.warn('获取伙伴信息失败:', error)
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
        
        // 如果用户元数据中没有用户名，再尝试从企业或学生表中获取
        if (!userData || !userData.user_metadata?.username) {
          const { data: companyData } = await supabase
            .from('companies')
            .select('company_name')
            .eq('user_id', msg.sender_id)
            .maybeSingle()
          
          if (companyData?.company_name) {
            senderName = companyData.company_name
          } else {
            const { data: studentData } = await supabase
              .from('students')
              .select('real_name')
              .eq('user_id', msg.sender_id)
              .maybeSingle()
            
            if (studentData?.real_name) {
              senderName = studentData.real_name
            }
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
    const partnerId = 'mock-partner-id'
    
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

// 刷新对话列表
const refreshMessages = () => {
  loadConversations()
  ElMessage.success('刷新成功')
}

// 生命周期
onMounted(() => {
  loadConversations()
})
</script>

<style scoped>
.student-messages-page {
  padding: 20px;
  min-height: calc(100vh - 100px);
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h2 {
  color: #303133;
  margin-bottom: 10px;
}

.page-header p {
  color: #606266;
}

.messages-container {
  display: flex;
  height: calc(100vh - 200px);
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 侧边栏样式 */
.conversations-sidebar {
  width: 350px;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
}

.search-container {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: white;
}

.conversations-list {
  flex: 1;
  overflow-y: auto;
}

.conversations {
  padding: 8px;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
  border: 1px solid #f0f0f0;
}

.conversation-item:hover {
  background: #f5f7fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.conversation-item.active {
  background: #ecf5ff;
  border-color: #409eff;
}

.conversation-avatar {
  position: relative;
  margin-right: 12px;
  flex-shrink: 0;
}

.unread-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background: #f56c6c;
  border-radius: 50%;
  border: 2px solid white;
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.conversation-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.conversation-time {
  font-size: 12px;
  color: #909399;
}

.conversation-preview {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unread-badge {
  background: #f56c6c;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 12px;
  min-width: 18px;
  text-align: center;
}

/* 聊天窗口样式 */
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.no-conversation-selected {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}

.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 关键：允许子元素收缩 */
}

.chat-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0; /* 防止头部被压缩 */
}

.chat-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  color: #303133;
  font-size: 16px;
}

.user-status {
  font-size: 12px;
  color: #67c23a;
}

.chat-actions {
  display: flex;
  gap: 8px;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8fafc;
  min-height: 0; /* 关键：允许消息区域滚动 */
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: min-content;
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  max-width: 70%;
}

.message-item.own-message {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-content {
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.message-item.own-message .message-content {
  background: #409eff;
  color: white;
}

.message-text {
  margin-bottom: 4px;
  line-height: 1.4;
}

.message-time {
  font-size: 12px;
  color: #909399;
}

.message-item.own-message .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.message-input-area {
  border-top: 1px solid #e4e7ed;
  background: white;
  flex-shrink: 0; /* 防止输入框被压缩 */
}

.input-container {
  padding: 16px 20px;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

/* 对话框样式 */
.new-conversation-dialog {
  padding: 0;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

/* 加载和空状态 */
.loading-container {
  padding: 20px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .student-messages-page {
    padding: 10px;
  }
  
  .messages-container {
    flex-direction: column;
    height: calc(100vh - 120px);
  }
  
  .conversations-sidebar {
    width: 100%;
    height: 200px;
  }
  
  .chat-container {
    height: calc(100% - 200px);
  }
  
  .message-item {
    max-width: 85%;
  }
  
  .sidebar-header {
    padding: 12px 16px;
  }
  
  .chat-header {
    padding: 12px 16px;
  }
}
</style>