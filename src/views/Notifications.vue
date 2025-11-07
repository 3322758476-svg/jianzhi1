<template>
  <div class="notifications-page">
    <div class="page-header">
      <h2>通知中心</h2>
      <p>查看和管理您的系统通知</p>
    </div>
    
    <div class="notifications-container">
      <el-card class="notifications-card">
        <template #header>
          <div class="card-header">
            <span>通知列表</span>
            <div class="header-actions">
              <el-button type="primary" @click="refreshNotifications">刷新</el-button>
              <el-button @click="markAllAsRead" :disabled="unreadCount === 0">全部标记为已读</el-button>
            </div>
          </div>
        </template>
        
        <div class="notifications-content">
          <div v-if="loading" class="loading-container">
            <el-skeleton :rows="5" animated />
          </div>
          
          <div v-else-if="notifications.length === 0" class="empty-state">
            <el-empty description="暂无通知" />
          </div>
          
          <div v-else class="notifications-list">
            <div 
              v-for="notification in notifications" 
              :key="notification.id"
              class="notification-item"
              :class="{ unread: !notification.read }"
            >
              <div class="notification-icon">
                <el-icon :color="getNotificationColor(notification.type)">
                  <component :is="getNotificationIcon(notification.type)" />
                </el-icon>
              </div>
              
              <div class="notification-content">
                <div class="notification-header">
                  <span class="notification-title">{{ notification.title }}</span>
                  <span class="notification-time">{{ formatTime(notification.time) }}</span>
                </div>
                <div class="notification-message">{{ notification.message }}</div>
                
                <div v-if="notification.actions" class="notification-actions">
                  <el-button 
                    v-for="action in notification.actions" 
                    :key="action.label"
                    :type="action.type"
                    size="small"
                    @click="handleNotificationAction(notification, action)"
                  >
                    {{ action.label }}
                  </el-button>
                </div>
              </div>
              
              <div class="notification-actions-right">
                <el-button 
                  v-if="!notification.read" 
                  type="text" 
                  size="small"
                  @click="markAsRead(notification.id)"
                >
                  标记已读
                </el-button>
                <el-button 
                  type="text" 
                  size="small"
                  @click="deleteNotification(notification.id)"
                >
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell, Message, User, Setting, InfoFilled } from '@element-plus/icons-vue'
import { supabase } from '../lib/supabase'

// 调试：检查环境变量和 Supabase 客户端
console.log('Supabase 配置:', {
  url: import.meta.env.VITE_SUPABASE_URL,
  key: import.meta.env.VITE_SUPABASE_ANON_KEY
})
console.log('Supabase 客户端初始化状态:', supabase ? '成功' : '失败')

// 定义通知类型
interface Notification {
  id: string
  title: string
  message: string
  type: 'system' | 'application' | 'recommendation' | 'interview' | 'result'
  read: boolean
  time: string
  actions?: Array<{
    label: string
    type: 'primary' | 'success' | 'warning' | 'danger' | 'info'
    handler?: () => void
  }>
}

const notifications = ref<Notification[]>([])
const loading = ref(false)
const unreadCount = ref(0)

// 从 Supabase 获取通知数据
const fetchNotifications = async (): Promise<Notification[]> => {
  // 获取当前用户ID
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('用户未登录')
    return []
  }

  console.log('当前用户ID:', user.id)

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id) // 只获取当前用户的通知
    .order('created_at', { ascending: false })

  if (error) {
    console.error('获取通知数据失败:', error)
    console.error('错误详情:', error.message)
    throw error
  }

  console.log('获取到的通知数据:', data)

  // 如果没有数据，返回空数组
  if (!data) {
    console.log('没有找到通知数据')
    return []
  }

  return data.map((n: any) => ({
    id: n.id,
    title: n.title,
    message: n.description || n.title, // 使用 description 字段作为消息内容
    type: n.type,
    read: n.read,
    time: n.created_at,
    actions: [] // 暂时不处理 actions
  }))
}

// 计算未读数量
const updateUnreadCount = () => {
  unreadCount.value = notifications.value.filter(n => !n.read).length
}

// 获取通知图标
const getNotificationIcon = (type: string) => {
  const icons: Record<string, any> = {
    system: InfoFilled,
    job: Bell,
    message: Message,
    user: User,
    setting: Setting
  }
  return icons[type] || Bell
}

// 获取通知颜色
const getNotificationColor = (type: string) => {
  const colors: Record<string, string> = {
    system: '#409EFF',
    application: '#67C23A',
    recommendation: '#E6A23C',
    interview: '#F56C6C',
    result: '#909399'
  }
  return colors[type] || '#409EFF'
}

// 格式化时间
const formatTime = (time: string) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return date.toLocaleDateString()
}

// 加载通知
const loadNotifications = async () => {
  loading.value = true
  try {
    notifications.value = await fetchNotifications()
    updateUnreadCount()
  } catch (error) {
    ElMessage.error('加载通知失败')
  } finally {
    loading.value = false
  }
}

// 标记为已读
const markAsRead = async (id: string) => {
  const notification = notifications.value.find(n => n.id === id)
  if (notification) {
    notification.read = true
    updateUnreadCount()
    ElMessage.success('标记为已读成功')
  }
}

// 全部标记为已读
const markAllAsRead = async () => {
  notifications.value.forEach(n => { n.read = true })
  updateUnreadCount()
  ElMessage.success('全部标记为已读成功')
}

// 删除通知
const deleteNotification = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这条通知吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    notifications.value = notifications.value.filter(n => n.id !== id)
    updateUnreadCount()
    ElMessage.success('删除成功')
  } catch (error) {
    // 用户取消操作
  }
}

// 处理通知操作
const handleNotificationAction = (notification: Notification, action: any) => {
  ElMessage.info(`执行操作: ${action.label}`)
  // 这里可以添加具体的操作逻辑
  console.log('处理通知:', notification, '操作:', action)
}

// 刷新通知
const refreshNotifications = () => {
  loadNotifications()
}

// 生命周期
onMounted(() => {
  loadNotifications()
})
</script>

<style scoped>
.notifications-page {
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

.notifications-container {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.notifications-content {
  min-height: 400px;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.3s;
  background: #ffffff;
}

.notification-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.notification-item.unread {
  border-left: 4px solid #409EFF;
  background: #f8fafc;
}

.notification-icon {
  margin-right: 12px;
  padding-top: 4px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notification-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.notification-message {
  color: #606266;
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 8px;
}

.notification-actions {
  display: flex;
  gap: 8px;
}

.notification-actions-right {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 12px;
}

.loading-container {
  padding: 20px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

@media (max-width: 768px) {
  .notifications-page {
    padding: 10px;
  }
  
  .notification-item {
    flex-direction: column;
    padding: 12px;
  }
  
  .notification-actions-right {
    flex-direction: row;
    margin-left: 0;
    margin-top: 12px;
    justify-content: flex-end;
  }
  
  .card-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>