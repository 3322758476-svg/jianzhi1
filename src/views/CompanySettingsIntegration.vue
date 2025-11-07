<template>
  <div class="company-settings-integration">
    <div class="page-header">
      <h1>系统集成</h1>
      <p>配置和管理第三方系统集成</p>
    </div>

    <div class="integration-container">
      <!-- 集成列表 -->
      <div class="integrations-list">
        <div class="integration-section">
          <h2>可用集成</h2>
          <div class="integration-cards">
            <div 
              v-for="integration in availableIntegrations" 
              :key="integration.id"
              :class="['integration-card', { active: integration.enabled }]"
            >
              <div class="card-header">
                <div class="integration-icon">
                  <el-icon><component :is="integration.icon" /></el-icon>
                </div>
                <div class="integration-info">
                  <h3>{{ integration.name }}</h3>
                  <p>{{ integration.description }}</p>
                </div>
                <div class="integration-status">
                  <el-switch
                    v-model="integration.enabled"
                    @change="toggleIntegration(integration)"
                  />
                </div>
              </div>
              
              <div v-if="integration.enabled" class="integration-config">
                <div class="config-section">
                  <h4>配置信息</h4>
                  <div class="config-fields">
                    <div 
                      v-for="field in integration.fields" 
                      :key="field.name"
                      class="config-field"
                    >
                      <label>{{ field.label }}</label>
                      <el-input
                        v-model="field.value"
                        :type="field.type"
                        :placeholder="field.placeholder"
                      />
                    </div>
                  </div>
                </div>
                
                <div class="integration-actions">
                  <el-button type="primary" size="small" @click="saveIntegration(integration)">
                    保存配置
                  </el-button>
                  <el-button size="small" @click="testIntegration(integration)">
                    测试连接
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 集成日志 -->
        <div class="integration-logs">
          <h2>集成日志</h2>
          <div class="logs-container">
            <div class="logs-filter">
              <el-select v-model="logFilter" placeholder="筛选日志类型">
                <el-option label="全部" value="all" />
                <el-option label="成功" value="success" />
                <el-option label="错误" value="error" />
                <el-option label="警告" value="warning" />
              </el-select>
              <el-date-picker
                v-model="logDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
              />
            </div>
            
            <div class="logs-list">
              <div 
                v-for="log in filteredLogs" 
                :key="log.id"
                :class="['log-item', log.type]"
              >
                <div class="log-time">{{ formatTime(log.time) }}</div>
                <div class="log-content">
                  <div class="log-message">{{ log.message }}</div>
                  <div class="log-details">{{ log.details }}</div>
                </div>
                <div class="log-type">
                  <el-tag :type="getLogTagType(log.type)" size="small">
                    {{ getLogTypeText(log.type) }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- API文档 -->
      <div class="api-documentation">
        <h2>API文档</h2>
        <div class="api-section">
          <h3>Webhook 配置</h3>
          <div class="api-info">
            <p>Webhook URL: <code>{{ webhookUrl }}</code></p>
            <el-button type="text" @click="copyWebhookUrl">复制</el-button>
          </div>
          
          <div class="api-example">
            <h4>事件类型</h4>
            <el-table :data="webhookEvents" style="width: 100%">
              <el-table-column prop="event" label="事件" />
              <el-table-column prop="description" label="描述" />
              <el-table-column prop="enabled" label="状态">
                <template #default="scope">
                  <el-switch v-model="scope.row.enabled" />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Connection, Bell, Message, Document } from '@element-plus/icons-vue'

// 可用集成列表
const availableIntegrations = ref([
  {
    id: 'webhook',
    name: 'Webhook 集成',
    description: '通过 Webhook 接收系统事件通知',
    icon: 'Connection',
    enabled: false,
    fields: [
      {
        name: 'webhookUrl',
        label: 'Webhook URL',
        type: 'text',
        placeholder: '请输入接收事件的 URL',
        value: ''
      },
      {
        name: 'secret',
        label: '密钥',
        type: 'password',
        placeholder: '请输入签名密钥',
        value: ''
      }
    ]
  },
  {
    id: 'notification',
    name: '通知集成',
    description: '集成邮件、短信等通知服务',
    icon: 'Bell',
    enabled: false,
    fields: [
      {
        name: 'emailServer',
        label: '邮件服务器',
        type: 'text',
        placeholder: 'SMTP 服务器地址',
        value: ''
      },
      {
        name: 'smsProvider',
        label: '短信服务商',
        type: 'text',
        placeholder: '短信服务商配置',
        value: ''
      }
    ]
  },
  {
    id: 'messaging',
    name: '消息集成',
    description: '集成即时通讯工具',
    icon: 'Message',
    enabled: false,
    fields: [
      {
        name: 'webhookToken',
        label: 'Webhook Token',
        type: 'password',
        placeholder: '请输入 Webhook Token',
        value: ''
      }
    ]
  },
  {
    id: 'document',
    name: '文档集成',
    description: '集成文档管理系统',
    icon: 'Document',
    enabled: false,
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: '请输入 API Key',
        value: ''
      }
    ]
  }
])

// 集成日志
const integrationLogs = ref([
  {
    id: 1,
    time: new Date('2024-01-15 10:30:00'),
    type: 'success',
    message: 'Webhook 集成测试成功',
    details: '连接正常，事件推送测试通过'
  },
  {
    id: 2,
    time: new Date('2024-01-15 09:15:00'),
    type: 'error',
    message: '通知集成配置错误',
    details: 'SMTP 服务器连接失败'
  },
  {
    id: 3,
    time: new Date('2024-01-14 16:45:00'),
    type: 'warning',
    message: '消息集成连接超时',
    details: 'Webhook 响应时间超过阈值'
  }
])

// Webhook 事件类型
const webhookEvents = ref([
  {
    event: 'job.created',
    description: '岗位创建事件',
    enabled: true
  },
  {
    event: 'job.updated',
    description: '岗位更新事件',
    enabled: true
  },
  {
    event: 'application.submitted',
    description: '申请提交事件',
    enabled: true
  },
  {
    event: 'application.status_changed',
    description: '申请状态变更事件',
    enabled: false
  }
])

const logFilter = ref('all')
const logDateRange = ref([])
const webhookUrl = ref('https://api.example.com/webhook/your-token')

// 过滤日志
const filteredLogs = computed(() => {
  let filtered = integrationLogs.value
  
  // 按类型过滤
  if (logFilter.value !== 'all') {
    filtered = filtered.filter(log => log.type === logFilter.value)
  }
  
  // 按时间范围过滤
  if (logDateRange.value && logDateRange.value.length === 2) {
    const [start, end] = logDateRange.value
    filtered = filtered.filter(log => {
      const logTime = log.time.getTime()
      return logTime >= start.getTime() && logTime <= end.getTime()
    })
  }
  
  return filtered
})

// 切换集成状态
const toggleIntegration = (integration: any) => {
  if (integration.enabled) {
    ElMessage.success(`${integration.name} 已启用`)
  } else {
    ElMessage.info(`${integration.name} 已禁用`)
  }
}

// 保存集成配置
const saveIntegration = (integration: any) => {
  // 这里应该调用 API 保存配置
  ElMessage.success(`${integration.name} 配置已保存`)
  
  // 记录日志
  integrationLogs.value.unshift({
    id: Date.now(),
    time: new Date(),
    type: 'success',
    message: `${integration.name} 配置保存成功`,
    details: '配置信息已更新到系统'
  })
}

// 测试集成连接
const testIntegration = (integration: any) => {
  ElMessage.info(`正在测试 ${integration.name} 连接...`)
  
  // 模拟测试过程
  setTimeout(() => {
    const success = Math.random() > 0.3
    if (success) {
      ElMessage.success(`${integration.name} 连接测试成功`)
      integrationLogs.value.unshift({
        id: Date.now(),
        time: new Date(),
        type: 'success',
        message: `${integration.name} 连接测试成功`,
        details: '连接正常，配置正确'
      })
    } else {
      ElMessage.error(`${integration.name} 连接测试失败`)
      integrationLogs.value.unshift({
        id: Date.now(),
        time: new Date(),
        type: 'error',
        message: `${integration.name} 连接测试失败`,
        details: '请检查配置信息是否正确'
      })
    }
  }, 1000)
}

// 复制 Webhook URL
const copyWebhookUrl = () => {
  navigator.clipboard.writeText(webhookUrl.value)
  ElMessage.success('Webhook URL 已复制到剪贴板')
}

// 格式化时间
const formatTime = (time: Date) => {
  return time.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取日志标签类型
const getLogTagType = (type: string) => {
  switch (type) {
    case 'success': return 'success'
    case 'error': return 'danger'
    case 'warning': return 'warning'
    default: return 'info'
  }
}

// 获取日志类型文本
const getLogTypeText = (type: string) => {
  switch (type) {
    case 'success': return '成功'
    case 'error': return '错误'
    case 'warning': return '警告'
    default: return '信息'
  }
}

onMounted(() => {
  console.log('系统集成页面初始化完成')
})
</script>

<style scoped>
.company-settings-integration {
  padding: 20px;
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 28px;
  color: #303133;
  margin: 0;
}

.page-header p {
  color: #909399;
  margin: 5px 0 0 0;
}

.integration-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
}

.integrations-list {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.integration-section h2 {
  margin: 0 0 20px 0;
  color: #303133;
  font-size: 20px;
}

.integration-cards {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.integration-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
  transition: all 0.3s;
}

.integration-card.active {
  border-color: #409eff;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.integration-icon {
  width: 48px;
  height: 48px;
  background: #f0f9ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.integration-icon .el-icon {
  font-size: 24px;
  color: #409eff;
}

.integration-info {
  flex: 1;
}

.integration-info h3 {
  margin: 0 0 4px 0;
  color: #303133;
  font-size: 16px;
}

.integration-info p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.integration-config {
  border-top: 1px solid #e4e7ed;
  padding-top: 16px;
  margin-top: 16px;
}

.config-section h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 14px;
}

.config-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.config-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.config-field label {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

.integration-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.integration-logs {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.logs-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.logs-filter {
  display: flex;
  gap: 12px;
  align-items: center;
}

.logs-list {
  max-height: 300px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 8px;
  border-left: 4px solid transparent;
}

.log-item.success {
  background: #f0f9ff;
  border-left-color: #67c23a;
}

.log-item.error {
  background: #fef0f0;
  border-left-color: #f56c6c;
}

.log-item.warning {
  background: #fdf6ec;
  border-left-color: #e6a23c;
}

.log-time {
  font-size: 12px;
  color: #909399;
  min-width: 140px;
}

.log-content {
  flex: 1;
}

.log-message {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  margin-bottom: 4px;
}

.log-details {
  font-size: 12px;
  color: #909399;
}

.log-type {
  min-width: 60px;
}

.api-documentation {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  height: fit-content;
}

.api-section {
  margin-bottom: 24px;
}

.api-section:last-child {
  margin-bottom: 0;
}

.api-section h3 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 18px;
}

.api-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.api-info code {
  background: #e4e7ed;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

.api-example h4 {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 14px;
}
</style>