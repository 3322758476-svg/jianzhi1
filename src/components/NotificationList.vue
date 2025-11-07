<template>
  <div class="notification-list">
    <div class="notification-header">
      <h3>通知中心</h3>
      <div class="header-actions">
        <el-button 
          type="text" 
          @click="markAllAsRead"
          :disabled="unreadCount === 0"
        >
          全部标记为已读
        </el-button>
        <el-button 
          type="text" 
          @click="refreshNotifications"
        >
          刷新
        </el-button>
      </div>
    </div>

    <div class="notification-filters">
      <el-radio-group v-model="activeTab" @change="handleTabChange">
        <el-radio-button label="all">全部</el-radio-button>
        <el-radio-button label="unread">未读</el-radio-button>
        <el-radio-button label="important">重要</el-radio-button>
        <el-radio-button label="urgent">紧急</el-radio-button>
      </el-radio-group>
    </div>

    <div class="notification-content">
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="filteredNotifications.length === 0" class="empty-state">
        <el-empty description="暂无通知" />
      </div>

      <div v-else class="notifications">
        <div 
          v-for="notification in filteredNotifications" 
          :key="notification.id"
          class="notification-item"
          :class="{ 
            'unread': !notification.read, 
            'important': notification.important,
            'urgent': notification.urgent
          }"
        >
          <div class="notification-icon">
            <el-icon v-if="notification.type === 'job'" color="#409EFF">
              <Document />
            </el-icon>
            <el-icon v-else-if="notification.type === 'application'" color="#67C23A">
              <User />
            </el-icon>
            <el-icon v-else-if="notification.type === 'system'" color="#909399">
              <Setting />
            </el-icon>
            <el-icon v-else-if="notification.type === 'message'" color="#E6A23C">
              <ChatDotRound />
            </el-icon>
            <el-icon v-else color="#F56C6C">
              <CircleFilled />
            </el-icon>
          </div>

          <div class="notification-content">
            <div class="notification-header">
              <span class="notification-title">{{ notification.title }}</span>
              <span class="notification-time">{{ formatTime(notification.created_at) }}</span>
            </div>
            <div class="notification-description">{{ notification.description }}</div>
            
            <div v-if="notification.content" class="notification-details">
              <div 
                v-for="(value, key) in notification.content" 
                :key="key"
                class="detail-item"
              >
                <span class="detail-label">{{ key }}：</span>
                <span class="detail-value">{{ value }}</span>
              </div>
            </div>

            <div v-if="notification.actions && notification.actions.length > 0" class="notification-actions">
              <el-button 
                v-for="action in notification.actions" 
                :key="action.label"
                :type="action.type"
                size="small"
                @click="handleAction(notification, action)"
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

      <div v-if="total > pageSize" class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, User, Setting, ChatDotRound } from '@element-plus/icons-vue'

// 定义 Notification 类型
interface Notification {
  id: string
  title: string
  description: string
  type: 'job' | 'application' | 'system' | 'message'
  read: boolean
  important: boolean
  urgent: boolean
  created_at: string
  content?: Record<string, any>
  actions?: Array<{
    label: string
    type: string
  }>
}

// 响应式数据
const notifications = ref<Notification[]>([])
const loading = ref(false)
const activeTab = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const unreadCount = ref(0)

// 计算属性
const filteredNotifications = computed(() => {
  let filtered = notifications.value
  
  switch (activeTab.value) {
    case 'unread':
      filtered = filtered.filter(n => !n.read)
      break
    case 'important':
      filtered = filtered.filter(n => n.important)
      break
    case 'urgent':
      filtered = filtered.filter(n => n.urgent)
      break
  }
  
  return filtered
})

// 模拟通知数据
const mockNotifications = [
  {
    id: '1',
    title: '欢迎使用兼职平台',
    description: '欢迎来到我们的兼职平台！您可以开始浏览和申请心仪的兼职岗位了。',
    type: 'system',
    read: false,
    important: true,
    urgent: false,
    created_at: new Date().toISOString(),
    content: {
      平台: '兼职平台',
      功能: '岗位浏览、申请、消息沟通'
    },
    actions: [
      { label: '开始浏览', type: 'primary' }
    ]
  },
  {
    id: '2',
    title: '系统维护通知',
    description: '平台将于今晚23:00-01:00进行系统维护，期间可能无法正常访问。',
    type: 'system',
    read: true,
    important: false,
    urgent: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    content: {
      维护时间: '今晚23:00-01:00',
      影响范围: '平台访问'
    }
  },
  {
    id: '3',
    title: '新岗位发布',
    description: '有新的兼职岗位发布，快来看看吧！',
    type: 'job',
    read: false,
    important: false,
    urgent: false,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    content: {
      岗位类型: '兼职',
      薪资范围: '面议',
      工作地点: '线上'
    },
    actions: [
      { label: '查看岗位', type: 'success' }
    ]
  }
]

// 方法
const loadNotifications = async () => {
  loading.value = true
  try {
    // 暂时使用模拟数据
    notifications.value = mockNotifications as Notification[]
    unreadCount.value = mockNotifications.filter(n => !n.read).length
    total.value = mockNotifications.length
  } catch (error) {
    ElMessage.error('加载通知失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const markAsRead = async (notificationId: string) => {
  try {
    // 模拟标记为已读
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
      unreadCount.value = notifications.value.filter(n => !n.read).length
    }
    ElMessage.success('标记为已读成功')
  } catch (error) {
    ElMessage.error('操作失败')
    console.error(error)
  }
}

const markAllAsRead = async () => {
  try {
    // 模拟全部标记为已读
    notifications.value.forEach(n => { n.read = true })
    unreadCount.value = 0
    ElMessage.success('全部标记为已读成功')
  } catch (error) {
    ElMessage.error('操作失败')
    console.error(error)
  }
}

const deleteNotification = async (notificationId: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这条通知吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 模拟删除
    notifications.value = notifications.value.filter(n => n.id !== notificationId)
    total.value = notifications.value.length
    unreadCount.value = notifications.value.filter(n => !n.read).length
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

const handleAction = (notification: Notification, action: any) => {
  // 处理通知操作
  console.log('处理通知操作:', notification, action)
  ElMessage.info(`执行操作: ${action.label}`)
}

const refreshNotifications = () => {
  loadNotifications()
}

const handleTabChange = () => {
  currentPage.value = 1
  loadNotifications()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadNotifications()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadNotifications()
}

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

// 生命周期
onMounted(() => {
  loadNotifications()
})

// 暴露方法给父组件
defineExpose({
  refreshNotifications
})
</script>

<style scoped>
.notification-list {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.notification-header h3 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.notification-filters {
  margin-bottom: 20px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 12px;
  transition: all 0.3s;
}

.notification-item.unread {
  border-left: 4px solid #409EFF;
  background-color: #f0f9ff;
}

.notification-item.important {
  border-color: #e6a23c;
}

.notification-item.urgent {
  border-color: #f56c6c;
}

.notification-icon {
  margin-right: 12px;
  padding-top: 2px;
}

.notification-content {
  flex: 1;
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
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.notification-description {
  color: #606266;
  margin-bottom: 8px;
}

.notification-details {
  background: #f5f7fa;
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.detail-item {
  display: flex;
  margin-bottom: 4px;
}

.detail-label {
  font-weight: 500;
  color: #606266;
  min-width: 80px;
}

.detail-value {
  color: #303133;
}

.notification-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.notification-actions-right {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 12px;
}

.pagination-container {
  margin-top: 20px;
  text-align: center;
}

.loading-container {
  padding: 20px 0;
}

.empty-state {
  padding: 40px 0;
}
</style>