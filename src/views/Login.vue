<template>
  <div class="login-container">
    <!-- 登录异常显示组件 -->
    <LoginErrorDisplay 
      ref="errorDisplayRef"
      @retry="handleRetryLogin"
    />
    
    <div class="login-form">
      <div class="form-header">
        <h2>登录大学生兼职平台</h2>
        <p>请选择您的身份类型登录</p>
      </div>

      <!-- 身份选择 -->
      <div class="role-selection">
        <div 
          :class="['role-card', { active: loginType === 'student' }]"
          @click="loginType = 'student'"
        >
          <div class="role-icon">
            <el-icon><User /></el-icon>
          </div>
          <h3>学生登录</h3>
          <p>寻找兼职机会，积累工作经验</p>
          <ul class="role-features">
            <li>浏览海量兼职岗位</li>
            <li>一键投递简历</li>
            <li>与企业实时沟通</li>
            <li>管理申请记录</li>
          </ul>
        </div>

        <div 
          :class="['role-card', { active: loginType === 'company' }]"
          @click="loginType = 'company'"
        >
          <div class="role-icon">
            <el-icon><OfficeBuilding /></el-icon>
          </div>
          <h3>企业登录</h3>
          <p>发布兼职岗位，招聘优秀人才</p>
          <ul class="role-features">
            <li>发布和管理岗位</li>
            <li>查看学生简历</li>
            <li>与学生沟通联系</li>
            <li>管理招聘流程</li>
          </ul>
        </div>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        label-width="80px"
        class="login-form-content"
      >
        <el-form-item :label="loginType === 'student' ? '学号/邮箱' : '企业账号'" prop="username">
          <el-input
            v-model="loginForm.username"
            :placeholder="loginType === 'student' ? '请输入学号或邮箱' : '请输入企业账号'"
            size="large"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <div class="form-options">
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
            <el-link type="primary" @click="handleForgotPassword">忘记密码？</el-link>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loginType === 'student' ? '学生登录' : '企业登录' }}
          </el-button>
        </el-form-item>

        <div class="divider">
          <span>或使用以下方式登录</span>
        </div>

        <div class="social-login">
          <el-button class="social-btn wechat" @click="handleWechatLogin">
            <el-icon><ChatDotRound /></el-icon>
            微信登录
          </el-button>
          <el-button class="social-btn qq" @click="handleQQLogin">
            <el-icon><UserFilled /></el-icon>
            QQ登录
          </el-button>
        </div>

        <div class="register-link">
          还没有账户？
          <el-link type="primary" @click="handleRegister">立即注册</el-link>
        </div>
      </el-form>
    </div>

    <div class="login-banner">
      <div class="banner-content">
        <h3>连接优秀大学生与优质企业</h3>
        <p>安全可靠的兼职平台，为您的职业生涯保驾护航</p>
        <div class="features">
          <div class="feature-item">
            <el-icon><Check /></el-icon>
            <span>海量优质兼职岗位</span>
          </div>
          <div class="feature-item">
            <el-icon><Check /></el-icon>
            <span>企业实名认证</span>
          </div>
          <div class="feature-item">
            <el-icon><Check /></el-icon>
            <span>完善的评价体系</span>
          </div>
          <div class="feature-item">
            <el-icon><Check /></el-icon>
            <span>实时沟通功能</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../store'
import { ChatDotRound, UserFilled, Check, User, OfficeBuilding } from '@element-plus/icons-vue'
import LoginErrorDisplay from '@/components/LoginErrorDisplay.vue'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref()
const errorDisplayRef = ref()
const loading = ref(false)
const rememberMe = ref(false)
const loginType = ref('student') // student 或 company

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    await loginFormRef.value.validate()
    loading.value = true

    // 显示登录诊断信息
    console.log('🔍 登录诊断信息:')
    console.log('登录类型:', loginType.value)
    console.log('账号:', loginForm.username)
    console.log('密码长度:', loginForm.password.length)

    // 调用 store 的登录方法
    const result = await userStore.login({
      username: loginForm.username,
      password: loginForm.password,
      type: loginType.value
    })
    
    if (result.success) {
      console.log('✅ 登录成功')
      
      // 检查用户角色是否与登录类型匹配
      if (loginType.value === 'company' && userStore.user?.role !== 'company') {
        console.warn('⚠️ 角色不匹配: 用户角色为', userStore.user?.role, '但登录类型为企业')
        ElMessage.warning('当前账号不是企业账号，已自动切换到学生模式')
        // 不退出登录，允许用户继续使用
      } else if (loginType.value === 'student' && userStore.user?.role !== 'student') {
        console.warn('⚠️ 角色不匹配: 用户角色为', userStore.user?.role, '但登录类型为学生')
        ElMessage.warning('当前账号不是学生账号，已自动切换到企业模式')
        // 不退出登录，允许用户继续使用
      }
      
      // 根据实际用户角色跳转到对应页面
      if (userStore.user?.role === 'company') {
        ElMessage.success('企业登录成功')
        router.push('/company/dashboard')
      } else {
        ElMessage.success('学生登录成功')
        router.push('/')
      }
    } else {
      console.error('❌ 登录失败:', result.error)
      handleLoginError(result.error)
    }
  } catch (error: any) {
    console.error('❌ 登录异常:', error)
    console.error('异常详情:', error.stack)
    
    // 更详细的错误分类处理
    if (error.message?.includes('Network Error')) {
      ElMessage.error('网络连接失败，请检查网络后重试')
    } else if (error.message?.includes('timeout')) {
      ElMessage.error('请求超时，请稍后重试')
    } else if (error.message?.includes('Failed to fetch')) {
      ElMessage.error('无法连接到服务器，请检查网络连接')
    } else if (error.message?.includes('CORS')) {
      ElMessage.error('跨域请求被阻止，请检查浏览器设置')
    } else if (error.message?.includes('SSL')) {
      ElMessage.error('安全连接失败，请检查证书设置')
    } else if (error.message?.includes('certificate')) {
      ElMessage.error('证书验证失败，请检查安全设置')
    } else {
      // 显示详细的错误诊断信息
      console.group('🔍 详细登录异常诊断')
      console.log('错误类型:', typeof error)
      console.log('错误消息:', error.message)
      console.log('错误名称:', error.name)
      console.log('错误代码:', error.code)
      console.log('完整错误对象:', error)
      console.groupEnd()
      
      ElMessage.error('登录异常，请稍后重试。如果问题持续存在，请联系技术支持')
    }
    
    // 显示错误详情面板
    if (errorDisplayRef.value) {
      errorDisplayRef.value.showErrorDisplay({
        message: '系统发生未知错误',
        details: `错误类型: ${typeof error}
错误消息: ${error.message || '无'}
错误名称: ${error.name || '无'}
错误代码: ${error.code || '无'}`,
        type: 'system_error',
        loginType: loginType.value,
        username: loginForm.username
      })
    }
  } finally {
    loading.value = false
  }
}

// 统一错误处理
const handleLoginError = (error: any) => {
  console.error('❌ handleLoginError 接收到的错误:', error)
  
  // 安全地处理错误对象
  const errorString = typeof error === 'string' ? error : 
                     error?.message ? error.message : 
                     error?.toString ? error.toString() : 
                     '未知错误'
  
  let errorMessage = '登录失败，请检查账号和密码'
  let errorType = 'unknown'
  
  if (errorString?.includes('Invalid login credentials')) {
    errorMessage = '账号或密码错误，请重新输入'
    errorType = 'invalid_credentials'
  } else if (errorString?.includes('Email not confirmed') || errorString === 'EMAIL_NOT_CONFIRMED') {
    errorMessage = '邮箱未验证，请先验证邮箱后再登录'
    errorType = 'email_not_confirmed'
  } else if (errorString?.includes('User not found')) {
    errorMessage = '账号不存在，请先注册或检查账号是否正确'
    errorType = 'user_not_found'
  } else if (errorString?.includes('Too many requests')) {
    errorMessage = '登录尝试过于频繁，请等待5分钟后再试'
    errorType = 'too_many_requests'
  } else if (errorString?.includes('Network Error')) {
    errorMessage = '网络连接失败，请检查网络连接后重试'
    errorType = 'network_error'
  } else if (errorString?.includes('timeout')) {
    errorMessage = '请求超时，请稍后重试'
    errorType = 'timeout'
  } else if (errorString?.includes('Failed to fetch')) {
    errorMessage = '无法连接到服务器，请检查网络连接'
    errorType = 'connection_failed'
  } else if (errorString) {
    errorMessage = `登录失败: ${errorString}`
    errorType = 'other_error'
  }
  
  console.error(`❌ 登录错误类型: ${errorType}, 错误信息: ${errorString}`)
  
  // 显示详细的错误提示
  ElMessage.error({
    message: errorMessage,
    duration: 5000, // 显示5秒
    showClose: true
  })
  
  // 显示错误详情面板
  if (errorDisplayRef.value) {
    errorDisplayRef.value.showErrorDisplay({
      message: errorMessage,
      details: errorString,
      type: errorType,
      loginType: loginType.value,
      username: loginForm.username
    })
  }
}

// 重试登录
const handleRetryLogin = () => {
  console.log('🔄 重试登录')
  handleLogin()
}

const handleWechatLogin = async () => {
  // 微信登录流程
  ElMessage.info('正在跳转到微信授权...')
  
  try {
    // 使用 Supabase OAuth 登录
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'wechat',
      options: {
        redirectTo: window.location.origin
      }
    })
    
    if (error) {
      ElMessage.error(`微信登录失败: ${error.message}`)
    }
  } catch (error) {
    ElMessage.error('微信登录异常，请稍后重试')
    console.error('微信登录异常:', error)
  }
}

const handleQQLogin = async () => {
  // QQ登录流程
  ElMessage.info('正在跳转到QQ授权...')
  
  try {
    // 使用 Supabase OAuth 登录
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'qq',
      options: {
        redirectTo: window.location.origin
      }
    })
    
    if (error) {
      ElMessage.error(`QQ登录失败: ${error.message}`)
    }
  } catch (error) {
    ElMessage.error('QQ登录异常，请稍后重试')
    console.error('QQ登录异常:', error)
  }
}

const handleForgotPassword = () => {
  router.push('/forgot-password')
}

const handleRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.login-container {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-form {
  flex: 1;
  max-width: 480px;
  background: white;
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-header {
  text-align: center;
  margin-bottom: 40px;
}

.form-header h2 {
  color: #333;
  margin-bottom: 10px;
  font-size: 28px;
  font-weight: 600;
}

.form-header p {
  color: #666;
  font-size: 14px;
}

.login-form-content {
  width: 100%;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
}

.divider {
  text-align: center;
  margin: 30px 0;
  position: relative;
  color: #999;
  font-size: 14px;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e8e8e8;
}

.divider span {
  background: white;
  padding: 0 20px;
  position: relative;
  z-index: 1;
}

.social-login {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
}

.social-btn {
  flex: 1;
  height: 44px;
  border: 1px solid #e8e8e8;
  background: white;
  color: #666;
}

.social-btn.wechat:hover {
  border-color: #07c160;
  color: #07c160;
}

.social-btn.qq:hover {
  border-color: #12b7f5;
  color: #12b7f5;
}

.register-link {
  text-align: center;
  color: #666;
  font-size: 14px;
}

.login-banner {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  padding: 60px;
}

.banner-content {
  max-width: 500px;
}

.banner-content h3 {
  font-size: 36px;
  font-weight: 600;
  margin-bottom: 20px;
  line-height: 1.3;
}

.banner-content p {
  font-size: 18px;
  margin-bottom: 40px;
  opacity: 0.9;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
}

.feature-item .el-icon {
  color: #52c41a;
}

.role-selection {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.role-card {
  flex: 1;
  padding: 24px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
}

.role-card:hover {
  border-color: #409EFF;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
}

.role-card.active {
  border-color: #409EFF;
  background: #f0f7ff;
}

.role-icon {
  font-size: 48px;
  color: #409EFF;
  margin-bottom: 16px;
}

.role-card h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.role-card p {
  margin: 0 0 16px 0;
  color: #606266;
  font-size: 14px;
}

.role-features {
  text-align: left;
  margin: 0;
  padding: 0;
  list-style: none;
}

.role-features li {
  padding: 4px 0;
  color: #909399;
  font-size: 12px;
  position: relative;
  padding-left: 16px;
}

.role-features li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #67C23A;
  font-weight: bold;
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }
  
  .login-form {
    max-width: none;
    padding: 40px 20px;
  }
  
  .login-banner {
    display: none;
  }
  
  .role-selection {
    flex-direction: column;
  }
}
</style>