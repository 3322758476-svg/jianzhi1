<template>
  <div class="message-list">
    <div class="message-header">
      <h3>消息中心</h3>
      <div class="header-actions">
        <el-button type="primary" @click="showNewMessageDialog = true">
          新消息
        </el-button>
        <el-button type="text" @click="refreshContent">
          刷新
        </el-button>
      </div>
    </div>

    <div class="message-content">
      <div class="conversation-list">
        <div class="conversation-header">
          <h4>对话列表</h4>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索对话"
            prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </div>

        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="3" animated />
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
                <span class="conversation-time">{{ formatTime(conversation.time) }}</span>
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

      <div class="message-detail">
        <div v-if="!activeConversation" class="no-conversation-selected">
          <el-empty description="请选择一个对话" />
        </div>

        <div v-else class="conversation-detail">
          <div class="conversation-header">
            <div class="conversation-user">
              <el-avatar :size="32" :src="activeConversation.avatar">
                {{ activeConversation.name?.charAt(0) }}
              </el-avatar>
              <span class="user-name">{{ activeConversation.name }}</span>
            </div>
            <div class="conversation-actions">
              <el-button type="text" @click="refreshConversation">刷新</el-button>
            </div>
          </div>

          <div class="messages-container">
            <div v-if="conversationLoading" class="loading-container">
              <el-skeleton :rows="5" animated />
            </div>

            <div v-else-if="messages.length === 0" class="empty-state">
              <el-empty description="暂无消息" />
            </div>

            <div v-else class="messages">
              <div 
                v-for="message in messages" 
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

          <div class="message-input">
            <el-input
              v-model="newMessage"
              placeholder="输入消息内容..."
              type="textarea"
              :rows="3"
              resize="none"
            />
            <div class="input-actions">
              <el-button type="text">
                <el-icon><Picture /></el-icon>
                图片
              </el-button>
              <el-button type="text">
                <el-icon><Document /></el-icon>
                文件
              </el-button>
              <el-button type="primary" @click="sendMessage">发送</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新消息对话框 -->
    <el-dialog v-model="showNewMessageDialog" title="新消息" width="500px">
      <div class="new-message-dialog">
        <el-form :model="newMessageForm" label-width="80px">
          <el-form-item label="收件人">
            <el-select v-model="newMessageForm.recipient" placeholder="选择收件人" style="width: 100%">
              <el-option label="企业A" value="company1" />
              <el-option label="企业B" value="company2" />
              <el-option label="学生C" value="student1" />
            </el-select>
          </el-form-item>
          <el-form-item label="内容">
            <el-input v-model="newMessageForm.content" type="textarea" :rows="4" />
          </el-form-item>
        </el-form>
        <div class="dialog-actions">
          <el-button @click="showNewMessageDialog = false">取消</el-button>
          <el-button type="primary" @click="createNewMessage">发送</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture, Document } from '@element-plus/icons-vue'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/store'

// 响应式数据
const searchKeyword = ref('')
const loading = ref(false)
const conversationLoading = ref(false)
const userStore = useUserStore()

// 对话相关数据
const conversations = ref<any[]>([])
const activeConversation = ref<any>(null)
const messages = ref([
  {
    id: '1',
    sender: '企业A',
    avatar: '',
    content: '您好，我们对您的简历很感兴趣',
    time: new Date(),
    isOwn: false
  },
  {
    id: '2',
    sender: '我',
    avatar: '',
    content: '谢谢您的关注，我很感兴趣',
    time: new Date(),
    isOwn: true
  }
])

const newMessage = ref('')

// 新消息对话框
const showNewMessageDialog = ref(false)
const newMessageForm = ref({
  recipient: '',
  content: ''
})

// 计算属性
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
    // 获取当前用户的联系人列表
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .or(`user1_id.eq.${userStore.user.id},user2_id.eq.${userStore.user.id}`)
      .order('last_activity', { ascending: false })
    
    if (error) throw error
    
    // 转换联系人数据为对话格式
    conversations.value = contacts?.map(contact => {
      const otherUserId = contact.user1_id === userStore.user.id ? contact.user2_id : contact.user1_id
      return {
        id: contact.id,
        name: `用户${otherUserId.substring(0, 8)}`, // 简化显示
        avatar: '',
        lastMessage: '开始对话',
        time: new Date(contact.last_activity),
        unreadCount: 0
      }
    }) || []
    
  } catch (error) {
    console.error('加载对话列表失败:', error)
    ElMessage.error('加载对话列表失败')
  } finally {
    loading.value = false
  }
}

// 从数据库加载消息
const loadMessages = async (conversationId: string) => {
  conversationLoading.value = true
  try {
    // 获取对方的用户ID
    const otherUserId = getOtherUserIdFromConversation(activeConversation.value)
    if (!otherUserId) {
      ElMessage.error('无法获取对方用户信息')
      return
    }
    
    // 使用 sender_id 和 receiver_id 来过滤消息
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userStore.user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userStore.user.id})`)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    // 转换消息数据
    messages.value = []
    
    for (const msg of data || []) {
      let senderName = `用户${msg.sender_id.substring(0, 8)}`
      
      // 尝试获取发送者信息
      try {
        // 如果是企业发送的消息
        const { data: companyData } = await supabase
          .from('companies')
          .select('company_name')
          .eq('user_id', msg.sender_id)
          .maybeSingle()
        
        if (companyData) {
          senderName = companyData.company_name
        } else {
          // 如果是学生发送的消息
          const { data: studentData } = await supabase
            .from('students')
            .select('name')
            .eq('user_id', msg.sender_id)
            .maybeSingle()
          
          if (studentData) {
            senderName = studentData.name
          }
        }
      } catch (error) {
        console.warn('获取发送者信息失败:', error)
      }
      
      messages.value.push({
        id: msg.id,
        sender: msg.sender_id === userStore.user.id ? '我' : senderName,
        avatar: '',
        content: msg.content,
        time: new Date(msg.created_at),
        isOwn: msg.sender_id === userStore.user.id
      })
    }
    
  } catch (error) {
    console.error('加载消息失败:', error)
    ElMessage.error('加载消息失败')
  } finally {
    conversationLoading.value = false
  }
}

// 发送消息到数据库
const sendMessageToDatabase = async (content: string, receiverId: string) => {
  if (!userStore.user?.id) return
  
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: userStore.user.id,
        receiver_id: receiverId,
        content: content,
        type: 'text'
      })
      .select()
    
    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('发送消息失败:', error)
    throw error
  }
}

// 从对话中获取对方用户ID
const getOtherUserIdFromConversation = (conversation: any) => {
  if (!conversation || !userStore.user?.id) return null
  
  // 如果对话对象包含 partnerId 字段，直接使用
  if (conversation.partnerId) {
    return conversation.partnerId
  }
  
  // 从对话名称中提取用户ID（格式："用户{userId}"）
  const nameMatch = conversation.name?.match(/用户([a-f0-9]+)/i)
  if (nameMatch && nameMatch[1]) {
    return nameMatch[1]
  }
  
  return null
}

// 方法
const handleSearch = () => {
  // 搜索逻辑
}

const selectConversation = (conversation: any) => {
  activeConversation.value = conversation
  // 加载对话消息
  loadMessages(conversation.id)
}

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
    // 获取对方的用户ID
    const otherUserId = getOtherUserIdFromConversation(activeConversation.value)
    if (!otherUserId) {
      ElMessage.error('无法获取对方用户信息')
      return
    }
    
    // 发送消息到数据库
    const sentMessage = await sendMessageToDatabase(newMessage.value, otherUserId)
    
    if (sentMessage) {
      // 添加到本地消息列表
      const message = {
        id: sentMessage.id,
        sender: '我',
        avatar: '',
        content: newMessage.value,
        time: new Date(sentMessage.created_at),
        isOwn: true
      }
      
      messages.value.push(message)
      newMessage.value = ''
      
      ElMessage.success('消息发送成功')
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败')
  }
}

const refreshConversation = () => {
  if (activeConversation.value) {
    loadMessages(activeConversation.value.id)
  }
}

const refreshContent = () => {
  loadConversations()
  ElMessage.success('刷新成功')
}

const createNewMessage = () => {
  if (!newMessageForm.value.recipient || !newMessageForm.value.content) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  ElMessage.success('消息发送成功')
  showNewMessageDialog.value = false
  newMessageForm.value = { recipient: '', content: '' }
}

// 工具函数
const formatTime = (time: Date) => {
  const now = new Date()
  const diff = now.getTime() - time.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  
  return time.toLocaleDateString()
}

// 生命周期
onMounted(() => {
  // 初始化数据
  loadConversations()
})

// 暴露方法给父组件
defineExpose({
  refreshContent
})
</script>

<style scoped>
.message-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.message-header h3 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.message-content {
  flex: 1;
  display: flex;
  height: 100%;
}

.conversation-list {
  width: 300px;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.conversation-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.conversation-header h4 {
  margin: 0 0 12px 0;
  color: #303133;
}

.conversations {
  flex: 1;
  overflow-y: auto;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f5f7fa;
  transition: background-color 0.2s;
}

.conversation-item:hover {
  background-color: #f5f7fa;
}

.conversation-item.active {
  background-color: #ecf5ff;
}

.conversation-avatar {
  margin-right: 12px;
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
  font-weight: 500;
  color: #303133;
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
  background-color: #f56c6c;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 12px;
  min-width: 18px;
  text-align: center;
}

.unread-dot {
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 8px;
  background-color: #f56c6c;
  border-radius: 50%;
}

.message-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.no-conversation-selected {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.conversation-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 关键：允许子元素收缩 */
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.conversation-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-weight: 500;
  color: #303133;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: min-content;
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.message-item.own-message {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  max-width: 60%;
  background-color: #f5f7fa;
  padding: 8px 12px;
  border-radius: 4px;
}

.message-item.own-message .message-content {
  background-color: #409eff;
  color: white;
}

.message-text {
  margin-bottom: 4px;
}

.message-time {
  font-size: 12px;
  color: #909399;
}

.message-item.own-message .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.message-input {
  border-top: 1px solid #e4e7ed;
  padding: 16px 20px;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.loading-container {
  padding: 20px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.new-message-dialog {
  padding: 0;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
</style>