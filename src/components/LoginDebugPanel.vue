<template>
  <div class="login-debug-panel" v-if="showDebug">
    <div class="debug-header">
      <h3>登录诊断面板</h3>
      <el-button size="small" @click="toggleDebug">
        {{ showDebug ? '隐藏' : '显示' }}诊断信息
      </el-button>
    </div>
    
    <div class="debug-content">
      <!-- 环境状态 -->
      <div class="debug-section">
        <h4>环境状态</h4>
        <div class="status-grid">
          <div class="status-item" :class="{ success: envStatus.success }">
            <span class="status-icon">{{ envStatus.success ? '✅' : '❌' }}</span>
            <span class="status-label">环境配置</span>
            <span class="status-detail">{{ envStatus.message }}</span>
          </div>
          <div class="status-item" :class="{ success: dbStatus.success }">
            <span class="status-icon">{{ dbStatus.success ? '✅' : '❌' }}</span>
            <span class="status-label">数据库连接</span>
            <span class="status-detail">{{ dbStatus.message }}</span>
          </div>
        </div>
      </div>

      <!-- 登录状态 -->
      <div class="debug-section">
        <h4>登录状态</h4>
        <div class="login-info">
          <div class="info-item">
            <label>登录类型:</label>
            <span>{{ loginType }}</span>
          </div>
          <div class="info-item">
            <label>账号:</label>
            <span>{{ username }}</span>
          </div>
          <div class="info-item">
            <label>密码长度:</label>
            <span>{{ passwordLength }}</span>
          </div>
          <div class="info-item">
            <label>登录结果:</label>
            <span :class="loginResultClass">{{ loginResult }}</span>
          </div>
        </div>
      </div>

      <!-- 错误信息 -->
      <div class="debug-section" v-if="errorMessage">
        <h4>错误信息</h4>
        <div class="error-details">
          <div class="error-message">{{ errorMessage }}</div>
          <div class="error-suggestions">
            <h5>建议解决方案:</h5>
            <ul>
              <li v-for="suggestion in errorSuggestions" :key="suggestion">{{ suggestion }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 调试操作 -->
      <div class="debug-section">
        <h4>调试操作</h4>
        <div class="debug-actions">
          <el-button size="small" @click="testConnection">测试连接</el-button>
          <el-button size="small" @click="clearCache">清除缓存</el-button>
          <el-button size="small" @click="showConsole">查看控制台</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { supabase } from '@/lib/supabase'

const showDebug = ref(false)
const loginType = ref('')
const username = ref('')
const passwordLength = ref(0)
const loginResult = ref('')
const errorMessage = ref('')
const errorSuggestions = ref<string[]>([])

const envStatus = reactive({
  success: false,
  message: '未检查'
})

const dbStatus = reactive({
  success: false,
  message: '未检查'
})

const loginResultClass = computed(() => {
  if (loginResult.value.includes('成功')) return 'success'
  if (loginResult.value.includes('失败')) return 'error'
  return ''
})

// 检查环境配置
const checkEnvironment = async () => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      envStatus.success = false
      envStatus.message = '环境变量未配置'
      return
    }
    
    envStatus.success = true
    envStatus.message = '配置正常'
  } catch (error) {
    envStatus.success = false
    envStatus.message = '检查失败'
  }
}

// 测试数据库连接
const testDatabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    
    if (error) {
      dbStatus.success = false
      dbStatus.message = `连接失败: ${error.message}`
    } else {
      dbStatus.success = true
      dbStatus.message = '连接正常'
    }
  } catch (error: any) {
    dbStatus.success = false
    dbStatus.message = `连接异常: ${error.message}`
  }
}

// 测试连接
const testConnection = async () => {
  await checkEnvironment()
  await testDatabaseConnection()
  
  if (envStatus.success && dbStatus.success) {
    ElMessage.success('连接测试通过')
  } else {
    ElMessage.warning('连接测试失败，请检查配置')
  }
}

// 清除缓存
const clearCache = () => {
  localStorage.removeItem('supabase.auth.token')
  sessionStorage.clear()
  ElMessage.success('缓存已清除，请重新登录')
}

// 显示控制台
const showConsole = () => {
  ElMessage.info('请打开浏览器开发者工具查看控制台输出')
}

// 切换调试面板显示
const toggleDebug = () => {
  showDebug.value = !showDebug.value
  if (showDebug.value) {
    testConnection()
  }
}

// 更新登录信息
const updateLoginInfo = (type: string, user: string, pwdLength: number, result: string, error?: string) => {
  loginType.value = type
  username.value = user
  passwordLength.value = pwdLength
  loginResult.value = result
  
  if (error) {
    errorMessage.value = error
    errorSuggestions.value = getErrorSuggestions(error)
  } else {
    errorMessage.value = ''
    errorSuggestions.value = []
  }
}

// 获取错误建议
const getErrorSuggestions = (error: string): string[] => {
  const suggestions: string[] = []
  
  if (error.includes('Invalid login credentials')) {
    suggestions.push('检查邮箱和密码是否正确')
    suggestions.push('尝试重置密码')
    suggestions.push('确认账号类型（学生/企业）')
  } else if (error.includes('Email not confirmed')) {
    suggestions.push('请先验证邮箱地址')
    suggestions.push('检查邮箱垃圾邮件文件夹')
    suggestions.push('重新发送验证邮件')
  } else if (error.includes('User not found')) {
    suggestions.push('请先注册账号')
    suggestions.push('检查邮箱地址是否正确')
    suggestions.push('确认账号类型')
  } else if (error.includes('Too many requests')) {
    suggestions.push('请等待5分钟后重试')
    suggestions.push('清除浏览器缓存')
  } else {
    suggestions.push('清除浏览器缓存后重试')
    suggestions.push('检查网络连接')
    suggestions.push('联系技术支持')
  }
  
  return suggestions
}

onMounted(() => {
  // 默认隐藏调试面板，可通过快捷键或特殊操作显示
  showDebug.value = false
})

// 暴露方法供父组件调用
defineExpose({
  updateLoginInfo,
  toggleDebug
})
</script>

<style scoped>
.login-debug-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 400px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  font-size: 12px;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 8px;
}

.debug-header h3 {
  margin: 0;
  font-size: 14px;
  color: #495057;
}

.debug-section {
  margin-bottom: 16px;
}

.debug-section h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #6c757d;
  font-weight: 600;
}

.status-grid {
  display: grid;
  gap: 8px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  background: white;
}

.status-item.success {
  border-left: 3px solid #28a745;
}

.status-item:not(.success) {
  border-left: 3px solid #dc3545;
}

.status-icon {
  font-size: 14px;
}

.status-label {
  font-weight: 600;
  min-width: 80px;
}

.status-detail {
  color: #6c757d;
}

.login-info {
  background: white;
  padding: 12px;
  border-radius: 4px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item label {
  font-weight: 600;
  color: #495057;
}

.info-item span.success {
  color: #28a745;
  font-weight: 600;
}

.info-item span.error {
  color: #dc3545;
  font-weight: 600;
}

.error-details {
  background: white;
  padding: 12px;
  border-radius: 4px;
}

.error-message {
  color: #dc3545;
  font-weight: 600;
  margin-bottom: 8px;
}

.error-suggestions h5 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #495057;
}

.error-suggestions ul {
  margin: 0;
  padding-left: 16px;
}

.error-suggestions li {
  margin-bottom: 4px;
  color: #6c757d;
}

.debug-actions {
  display: flex;
  gap: 8px;
}
</style>