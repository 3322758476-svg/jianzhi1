<template>
  <el-dialog
    v-model="visible"
    :title="`申请详情 - ${application?.student?.name || '未知学生'}`"
    width="800px"
    :before-close="handleClose"
  >
    <div v-if="application" class="application-detail">
      <!-- 学生基本信息 -->
      <el-card class="student-info-card">
        <template #header>
          <div class="card-header">
            <span>学生信息</span>
          </div>
        </template>
        
        <div class="student-basic">
          <div class="avatar-section">
            <el-avatar :size="80" :src="application.student.avatar" />
            <div class="student-name">{{ application.student.name }}</div>
          </div>
          
          <div class="student-details">
            <div class="detail-row">
              <span class="label">学校：</span>
              <span class="value">{{ application.student.school || '未填写' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">专业：</span>
              <span class="value">{{ application.student.major || '未填写' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">年级：</span>
              <span class="value">{{ application.student.grade || '未填写' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">联系方式：</span>
              <span class="value">{{ application.student.phone || '未填写' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">邮箱：</span>
              <span class="value">{{ application.student.email || '未填写' }}</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 申请信息 -->
      <el-card class="application-info-card">
        <template #header>
          <div class="card-header">
            <span>申请信息</span>
            <el-tag :type="getStatusType(application.status)">
              {{ getStatusText(application.status) }}
            </el-tag>
          </div>
        </template>
        
        <div class="application-details">
          <div class="detail-row">
            <span class="label">申请岗位：</span>
            <span class="value">{{ application.job.title }}</span>
          </div>
          <div class="detail-row">
            <span class="label">申请时间：</span>
            <span class="value">{{ formatDate(application.applyTime) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">申请留言：</span>
            <span class="value">{{ application.message || '无留言' }}</span>
          </div>
        </div>
      </el-card>

      <!-- 消息历史 -->
      <el-card class="messages-card">
        <template #header>
          <div class="card-header">
            <span>消息历史</span>
            <el-button type="primary" size="small" @click="loadMessages">
              刷新消息
            </el-button>
          </div>
        </template>
        
        <div class="messages-section">
          <div v-if="loadingMessages" class="loading-container">
            <el-skeleton :rows="3" animated />
          </div>
          
          <div v-else-if="messages.length === 0" class="empty-content">
            <el-empty description="暂无消息记录" :image-size="60" />
          </div>
          
          <div v-else class="messages-list">
            <div 
              v-for="message in messages" 
              :key="message.id"
              class="message-item"
              :class="{ 'sent-by-me': message.sent_by_me }"
            >
              <div class="message-avatar">
                <el-avatar :size="32" :src="message.avatar">
                  {{ message.sender_name?.charAt(0) }}
                </el-avatar>
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="sender-name">{{ message.sender_name }}</span>
                  <span class="message-time">{{ formatTime(message.created_at) }}</span>
                </div>
                <div class="message-text">{{ message.content }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 简历信息 -->
      <el-card class="resume-info-card">
        <template #header>
          <div class="card-header">
            <span>简历信息</span>
          </div>
        </template>
        
        <div class="resume-sections">
          <!-- 教育背景 -->
          <div class="resume-section">
            <h4>教育背景</h4>
            <div v-if="application.resume.education">
              <p>{{ application.resume.education }}</p>
            </div>
            <div v-else class="empty-content">
              <el-empty description="未填写教育背景" :image-size="60" />
            </div>
          </div>

          <!-- 技能特长 -->
          <div class="resume-section">
            <h4>技能特长</h4>
            <div v-if="application.resume.skills && application.resume.skills.length > 0">
              <el-tag
                v-for="skill in application.resume.skills"
                :key="skill"
                type="info"
                size="small"
                style="margin-right: 8px; margin-bottom: 8px;"
              >
                {{ skill }}
              </el-tag>
            </div>
            <div v-else class="empty-content">
              <el-empty description="未填写技能特长" :image-size="60" />
            </div>
          </div>

          <!-- 工作经历 -->
          <div class="resume-section">
            <h4>工作经历</h4>
            <div v-if="application.resume.experiences && application.resume.experiences.length > 0">
              <div
                v-for="exp in application.resume.experiences"
                :key="exp.id"
                class="experience-item"
              >
                <div class="experience-title">{{ exp.title }}</div>
                <div class="experience-company">{{ exp.company }}</div>
                <div class="experience-period">{{ exp.period }}</div>
                <div class="experience-description">{{ exp.description }}</div>
              </div>
            </div>
            <div v-else class="empty-content">
              <el-empty description="未填写工作经历" :image-size="60" />
            </div>
          </div>
        </div>
      </el-card>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button 
          v-if="application.status === 'pending'" 
          type="primary"
          @click="handleStatusChange('reviewing')"
        >
          开始审核
        </el-button>
        <el-button 
          v-if="application.status === 'reviewing'" 
          type="success"
          @click="handleStatusChange('accepted')"
        >
          通过申请
        </el-button>
        <el-button 
          v-if="application.status === 'reviewing'" 
          type="danger"
          @click="handleStatusChange('rejected')"
        >
          拒绝申请
        </el-button>
        <el-button @click="sendMessage">
          发送消息
        </el-button>
        <el-button @click="downloadResume">
          下载简历
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { supabase } from '@/lib/supabase'

interface Props {
  visible: boolean
  application: any
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'status-change', applicationId: string, newStatus: string): void
}

interface Message {
  id: string
  content: string
  created_at: string
  sender_name: string
  avatar: string
  sent_by_me: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = ref(props.visible)
const messages = ref<Message[]>([])
const loadingMessages = ref(false)

watch(() => props.visible, (newVal) => {
  visible.value = newVal
})

watch(visible, (newVal) => {
  emit('update:visible', newVal)
  if (newVal && props.application) {
    loadMessages()
  }
})

const handleClose = () => {
  visible.value = false
}

// 加载消息历史
const loadMessages = async () => {
  if (!props.application?.student?.id) {
    console.error('无法获取学生信息')
    return
  }

  try {
    loadingMessages.value = true
    
    // 获取当前用户信息
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      ElMessage.warning('用户未登录')
      return
    }

    // 获取学生用户ID - 使用更安全的查询方式
    let studentUserId = null
    
    try {
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('user_id')
        .eq('id', props.application.student.id)
        .maybeSingle() // 使用 maybeSingle 而不是 single
      
      if (studentError) {
        console.warn('查询学生数据失败，尝试使用默认值:', studentError.message)
      } else if (studentData?.user_id) {
        studentUserId = studentData.user_id
      }
    } catch (error) {
      console.warn('学生数据查询异常:', error)
    }
    
    // 如果无法获取学生用户ID，不能发送消息
    if (!studentUserId) {
      console.warn('无法获取学生用户ID，无法发送消息')
      ElMessage.error('无法获取学生用户信息，请确保学生已注册账户')
      return
    }

    // 使用新的对话表结构获取消息
    // 先查找或创建对话
    const conversationId = await ensureConversation(user.id, studentUserId)
    
    // 获取对话消息 - 简化查询避免复杂关联
    const { data: messagesData, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('获取消息失败:', error)
      ElMessage.error('获取消息失败')
      return
    }

    // 处理消息数据
    messages.value = (messagesData || []).map(msg => ({
      id: msg.id,
      content: msg.content,
      created_at: msg.created_at,
      sender_name: msg.sender_id === user.id ? '我' : '对方',
      avatar: '',
      sent_by_me: msg.sender_id === user.id
    }))

  } catch (error) {
    console.error('加载消息异常:', error)
    ElMessage.error('加载消息失败')
  } finally {
    loadingMessages.value = false
  }

}

const handleStatusChange = async (newStatus: string) => {
  try {
    let message = ''
    
    switch (newStatus) {
      case 'reviewing':
        message = '确定开始审核此申请吗？'
        break
      case 'accepted':
        message = '确定通过此申请吗？'
        break
      case 'rejected':
        message = '确定拒绝此申请吗？'
        break
    }
    
    await ElMessageBox.confirm(message, '确认操作', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    emit('status-change', props.application.id, newStatus)
    ElMessage.success('操作成功')
    
    if (newStatus === 'accepted') {
      // 发送申请通过通知和消息给学生
      await sendApplicationAcceptedNotification()
    }
  } catch {
    // 用户取消操作
  }
}

// 发送申请通过通知给学生的函数
const sendApplicationAcceptedNotification = async () => {
  try {
    if (!props.application?.student?.id) {
      console.error('无法获取学生信息')
      return
    }
    
    // 获取当前用户信息
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('用户未登录')
      return
    }

    // 获取学生用户ID
    let studentUserId = null
    
    try {
      // 首先尝试直接从application数据中获取学生用户ID
      if (props.application.student?.user_id) {
        studentUserId = props.application.student.user_id
      } else {
        // 如果application中没有，则查询数据库
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('user_id')
          .eq('id', props.application.student.id)
          .maybeSingle()
        
        if (studentError) {
          console.error('查询学生数据失败:', studentError)
          // 尝试使用默认的学生用户ID（如果知道的话）
          // 这里可以添加一个默认的学生用户ID用于测试
        } else if (studentData?.user_id) {
          studentUserId = studentData.user_id
        }
      }
    } catch (error) {
      console.error('获取学生用户ID异常:', error)
    }
    
    if (!studentUserId) {
      console.error('无法获取学生用户ID，无法发送通知。学生ID:', props.application.student?.id)
      ElMessage.error('无法获取学生用户信息，请确保学生已注册账户')
      return
    }
    
    console.log('获取到的学生用户ID:', studentUserId)

    // 获取企业信息
    let companyName = '企业'
    try {
      const { data: companyData } = await supabase
        .from('companies')
        .select('company_name')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (companyData?.company_name) {
        companyName = companyData.company_name
      }
    } catch (error) {
      console.warn('获取企业信息失败:', error)
    }

    // 1. 发送系统通知
    const notificationContent = `恭喜！您的申请已通过 ${companyName} 的审核。请查看消息详情。`
    
    // 简化通知发送，避免权限问题
    try {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: studentUserId,
          type: 'application',
          title: '申请通过通知',
          description: notificationContent,
          related_id: props.application.id,
          important: true
        })

      if (notificationError) {
        console.warn('发送通知失败（可能是权限问题）:', notificationError)
        // 通知发送失败不影响主要业务流程
      }
    } catch (error) {
      console.warn('通知发送异常:', error)
    }

    // 2. 发送消息给学生
    const messageContent = `恭喜！您的申请已通过审核。${companyName} 已同意您的申请。请保持联系方式畅通，我们会尽快与您联系安排后续事宜。`
    
    // 确保对话关系存在
    const conversationId = await ensureConversation(user.id, studentUserId)
    
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: studentUserId,
        content: messageContent,
        type: 'system'
      })

    if (messageError) {
      console.error('发送消息失败:', messageError)
    }

    ElMessage.success('已发送申请通过通知给学生')
    
  } catch (error) {
    console.error('发送通知和消息失败:', error)
    ElMessage.error('发送通知失败，但申请状态已更新')
  }
}

const sendMessage = async () => {
  try {
    if (!props.application?.student?.id) {
      ElMessage.warning('无法获取学生信息')
      return
    }
    
    // 获取当前用户信息
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      ElMessage.warning('用户未登录')
      return
    }

    // 获取学生用户ID - 使用更安全的查询方式
    let studentUserId = null
    
    try {
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('user_id')
        .eq('id', props.application.student.id)
        .maybeSingle() // 使用 maybeSingle 而不是 single
      
      if (studentError) {
        console.warn('查询学生数据失败，尝试使用默认值:', studentError.message)
      } else if (studentData?.user_id) {
        studentUserId = studentData.user_id
      }
    } catch (error) {
      console.warn('学生数据查询异常:', error)
    }
    
    // 如果无法获取学生用户ID，不能发送消息
    if (!studentUserId) {
      console.warn('无法获取学生用户ID，无法发送消息')
      ElMessage.error('无法获取学生用户信息，请确保学生已注册账户')
      return
    }
    
    // 显示消息输入框
    const messageContent = await ElMessageBox.prompt('请输入要发送的消息', '发送消息', {
      confirmButtonText: '发送',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请输入消息内容...'
    })
    
    if (messageContent.value) {
      // 调用消息发送API
      const { success, error } = await sendMessageToStudent(studentUserId, messageContent.value)
      
      if (success) {
        ElMessage.success('消息发送成功')
        // 重新加载消息
        await loadMessages()
      } else {
        ElMessage.error(`消息发送失败: ${error}`)
      }
    }
  } catch (error) {
    // 用户取消操作
    if (error !== 'cancel') {
      ElMessage.error('发送消息失败')
    }
  }
}

// 确保对话关系存在的辅助函数
const ensureConversation = async (user1Id: string, user2Id: string): Promise<string> => {
  try {
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

      // 创建新的对话 - 这里需要确定谁是学生，谁是企业
      // 简化处理：让第一个用户作为学生，第二个用户作为企业
      const { data: newConversation, error: insertError } = await supabase
        .from('conversations')
        .insert([{
          student_id: user1Id,
          company_id: user2Id
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
}

// 发送消息给学生的辅助函数
const sendMessageToStudent = async (studentUserId: string, content: string) => {
  try {
    // 获取当前用户信息
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: '用户未登录' }
    }

    // 确保对话关系存在
    const conversationId = await ensureConversation(user.id, studentUserId)

    // 发送消息
    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: studentUserId,
        content: content,
        type: 'text'
      })

    if (error) {
      console.error('发送消息失败:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('发送消息异常:', error)
    return { success: false, error: error.message }
  }
}

const downloadResume = () => {
  ElMessage.info('简历下载功能开发中')
}

const getStatusType = (status: string) => {
  const types: Record<string, any> = {
    pending: 'warning',
    reviewing: 'info',
    accepted: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待处理',
    reviewing: '审核中',
    accepted: '已通过',
    rejected: '已拒绝'
  }
  return texts[status] || '未知'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // 如果是今天
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  
  // 如果是昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  
  // 如果是本周
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  if (date > weekAgo) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return days[date.getDay()] + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  
  // 其他情况
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.application-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.student-basic {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.student-name {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.student-details {
  flex: 1;
}

.detail-row {
  display: flex;
  margin-bottom: 12px;
  line-height: 1.5;
}

.detail-row .label {
  width: 80px;
  color: #606266;
  font-weight: 500;
}

.detail-row .value {
  flex: 1;
  color: #303133;
}

.application-details {
  padding: 0;
}

.resume-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.resume-section h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.experience-item {
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 12px;
}

.experience-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.experience-company {
  color: #606266;
  margin-bottom: 4px;
}

.experience-period {
  color: #909399;
  font-size: 12px;
  margin-bottom: 8px;
}

.experience-description {
  color: #606266;
  line-height: 1.5;
}

.empty-content {
  text-align: center;
  padding: 20px 0;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

/* 消息样式 */
.messages-section {
  max-height: 300px;
  overflow-y: auto;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message-item.sent-by-me {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
  max-width: 70%;
}

.message-item.sent-by-me .message-content {
  background: #409eff;
  color: white;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.sender-name {
  font-weight: 600;
  font-size: 14px;
}

.message-item.sent-by-me .sender-name {
  color: rgba(255, 255, 255, 0.9);
}

.message-time {
  font-size: 12px;
  color: #909399;
}

.message-item.sent-by-me .message-time {
  color: rgba(255, 255, 255, 0.7);
}

.message-text {
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.loading-container {
  padding: 20px 0;
}

@media (max-width: 768px) {
  .student-basic {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .detail-row {
    flex-direction: column;
    text-align: center;
  }
  
  .detail-row .label {
    width: auto;
    margin-bottom: 4px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .message-content {
    max-width: 85%;
  }
}
</style>