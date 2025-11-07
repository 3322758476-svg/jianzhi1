<template>
  <div class="login-error-display" v-if="showError">
    <div class="error-header">
      <el-icon class="error-icon"><Warning /></el-icon>
      <span class="error-title">登录异常</span>
      <el-button size="small" type="text" @click="closeError" class="close-btn">
        <el-icon><Close /></el-icon>
      </el-button>
    </div>
    
    <div class="error-content">
      <div class="error-message">{{ errorMessage }}</div>
      
      <div class="error-details" v-if="errorDetails">
        <div class="details-header">详细信息:</div>
        <div class="details-content">{{ errorDetails }}</div>
      </div>
      
      <div class="suggestions" v-if="suggestions.length > 0">
        <div class="suggestions-header">建议解决方案:</div>
        <ul class="suggestions-list">
          <li v-for="(suggestion, index) in suggestions" :key="index">
            <el-icon class="suggestion-icon"><InfoFilled /></el-icon>
            {{ suggestion }}
          </li>
        </ul>
      </div>
      
      <div class="debug-info" v-if="showDebug">
        <div class="debug-header">调试信息:</div>
        <div class="debug-content">
          <div><strong>错误类型:</strong> {{ errorType }}</div>
          <div><strong>时间:</strong> {{ errorTime }}</div>
          <div><strong>登录类型:</strong> {{ loginType }}</div>
          <div><strong>账号:</strong> {{ username }}</div>
        </div>
      </div>
    </div>
    
    <div class="error-actions">
      <el-button size="small" @click="retryLogin" type="primary">重试登录</el-button>
      <el-button size="small" @click="showDebug = !showDebug">
        {{ showDebug ? '隐藏' : '显示' }}调试信息
      </el-button>
      <el-button size="small" @click="clearCache">清除缓存</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Warning, Close, InfoFilled } from '@element-plus/icons-vue'

interface ErrorInfo {
  message: string
  details?: string
  type: string
  loginType: string
  username: string
}

const showError = ref(false)
const showDebug = ref(false)
const errorMessage = ref('')
const errorDetails = ref('')
const errorType = ref('')
const loginType = ref('')
const username = ref('')
const errorTime = ref('')
const suggestions = ref<string[]>([])

// 错误类型对应的建议
const errorSuggestions: Record<string, string[]> = {
  invalid_credentials: [
    '检查邮箱和密码是否正确',
    '确认大小写输入正确',
    '尝试重置密码',
    '确认账号类型（学生/企业）'
  ],
  email_not_confirmed: [
    '请先验证邮箱地址',
    '检查邮箱垃圾邮件文件夹',
    '重新发送验证邮件',
    '联系客服协助验证'
  ],
  user_not_found: [
    '请先注册账号',
    '检查邮箱地址是否正确',
    '确认账号类型',
    '尝试使用其他登录方式'
  ],
  too_many_requests: [
    '请等待5分钟后重试',
    '清除浏览器缓存和Cookie',
    '尝试使用其他浏览器',
    '联系技术支持'
  ],
  network_error: [
    '检查网络连接是否正常',
    '尝试切换网络环境',
    '刷新页面后重试',
    '检查防火墙设置'
  ],
  timeout: [
    '服务器响应超时，请稍后重试',
    '检查网络连接速度',
    '尝试在非高峰时段登录',
    '联系技术支持'
  ],
  connection_failed: [
    '无法连接到服务器',
    '检查网络代理设置',
    '尝试使用移动网络',
    '联系网络管理员'
  ],
  default: [
    '清除浏览器缓存后重试',
    '尝试使用其他浏览器',
    '检查系统时间是否正确',
    '联系技术支持'
  ]
}

// 显示错误
const showErrorDisplay = (errorInfo: ErrorInfo) => {
  errorMessage.value = errorInfo.message
  errorDetails.value = errorInfo.details || ''
  errorType.value = errorInfo.type
  loginType.value = errorInfo.loginType
  username.value = errorInfo.username
  errorTime.value = new Date().toLocaleString('zh-CN')
  
  // 获取对应的建议
  suggestions.value = errorSuggestions[errorInfo.type] || errorSuggestions.default
  
  showError.value = true
  showDebug.value = false
}

// 关闭错误显示
const closeError = () => {
  showError.value = false
}

// 重试登录
const retryLogin = () => {
  closeError()
  // 触发重试事件
  emit('retry')
}

// 清除缓存
const clearCache = () => {
  localStorage.removeItem('supabase.auth.token')
  sessionStorage.clear()
  ElMessage.success('缓存已清除，请重新登录')
  closeError()
}

// 暴露方法供父组件调用
const emit = defineEmits<{
  retry: []
}>()

defineExpose({
  showErrorDisplay
})

onMounted(() => {
  // 监听全局错误
  window.addEventListener('error', (event) => {
    if (event.message.includes('login') || event.message.includes('auth')) {
      showErrorDisplay({
        message: '系统发生未知错误',
        details: event.message,
        type: 'system_error',
        loginType: 'unknown',
        username: ''
      })
    }
  })
})
</script>

<style scoped>
.login-error-display {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500px;
  max-width: 90vw;
  background: #fff;
  border: 1px solid #f56c6c;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.15);
  z-index: 9999;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translate(-50%, -60%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

.error-header {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #fef0f0;
  border-bottom: 1px solid #fde2e2;
  border-radius: 8px 8px 0 0;
}

.error-icon {
  color: #f56c6c;
  font-size: 18px;
  margin-right: 8px;
}

.error-title {
  font-size: 16px;
  font-weight: 600;
  color: #f56c6c;
  flex: 1;
}

.close-btn {
  color: #909399;
  padding: 4px;
}

.close-btn:hover {
  color: #f56c6c;
}

.error-content {
  padding: 16px;
  max-height: 60vh;
  overflow-y: auto;
}

.error-message {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 12px;
}

.error-details {
  margin-bottom: 12px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  border-left: 3px solid #909399;
}

.details-header {
  font-size: 12px;
  color: #909399;
  font-weight: 600;
  margin-bottom: 4px;
}

.details-content {
  font-size: 12px;
  color: #606266;
  font-family: 'Courier New', monospace;
}

.suggestions {
  margin-bottom: 12px;
}

.suggestions-header {
  font-size: 12px;
  color: #909399;
  font-weight: 600;
  margin-bottom: 8px;
}

.suggestions-list {
  margin: 0;
  padding-left: 16px;
}

.suggestions-list li {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
  display: flex;
  align-items: flex-start;
}

.suggestion-icon {
  color: #409eff;
  font-size: 12px;
  margin-right: 6px;
  margin-top: 2px;
}

.debug-info {
  margin-top: 12px;
  padding: 8px;
  background: #f0f9ff;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

.debug-header {
  font-size: 12px;
  color: #409eff;
  font-weight: 600;
  margin-bottom: 6px;
}

.debug-content {
  font-size: 11px;
  color: #606266;
  font-family: 'Courier New', monospace;
}

.debug-content div {
  margin-bottom: 2px;
}

.error-actions {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #ebeef5;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .login-error-display {
    width: 95vw;
  }
  
  .error-actions {
    flex-direction: column;
  }
  
  .error-actions .el-button {
    width: 100%;
  }
}
</style>