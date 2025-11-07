<template>
  <div class="forgot-password-container">
    <div class="forgot-password-form">
      <div class="form-header">
        <h2>找回密码</h2>
        <p>请输入您的邮箱地址，我们将发送重置密码的链接</p>
      </div>

      <el-steps :active="currentStep" align-center class="steps">
        <el-step title="验证邮箱" description="输入注册邮箱" />
        <el-step title="验证身份" description="输入验证码" />
        <el-step title="重置密码" description="设置新密码" />
      </el-steps>

      <!-- 第一步：验证邮箱 -->
      <div v-if="currentStep === 1" class="step-content">
        <el-form
          ref="emailFormRef"
          :model="emailForm"
          :rules="emailRules"
          label-width="100px"
          class="step-form"
        >
          <el-form-item label="邮箱地址" prop="email">
            <el-input
              v-model="emailForm.email"
              placeholder="请输入注册时使用的邮箱地址"
              size="large"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="submit-btn"
              :loading="sendingCode"
              @click="sendVerificationCode"
            >
              发送验证码
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 第二步：验证身份 -->
      <div v-if="currentStep === 2" class="step-content">
        <el-form
          ref="codeFormRef"
          :model="codeForm"
          :rules="codeRules"
          label-width="100px"
          class="step-form"
        >
          <el-form-item label="验证码" prop="code">
            <el-input
              v-model="codeForm.code"
              placeholder="请输入6位验证码"
              size="large"
              maxlength="6"
            />
          </el-form-item>

          <div class="code-tips">
            <p>验证码已发送至：{{ emailForm.email }}</p>
            <el-button
              type="text"
              :disabled="countdown > 0"
              @click="resendCode"
            >
              {{ countdown > 0 ? `${countdown}秒后重发` : '重新发送' }}
            </el-button>
          </div>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="submit-btn"
              @click="verifyCode"
            >
              验证
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 第三步：重置密码 -->
      <div v-if="currentStep === 3" class="step-content">
        <el-form
          ref="passwordFormRef"
          :model="passwordForm"
          :rules="passwordRules"
          label-width="100px"
          class="step-form"
        >
          <el-form-item label="新密码" prop="password">
            <el-input
              v-model="passwordForm.password"
              type="password"
              placeholder="请输入新密码"
              size="large"
              show-password
            />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="passwordForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              size="large"
              show-password
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="submit-btn"
              :loading="resetting"
              @click="resetPassword"
            >
              重置密码
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="back-link">
        <el-link type="primary" @click="$router.push('/login')">
          <el-icon><ArrowLeft /></el-icon>
          返回登录
        </el-link>
      </div>
    </div>

    <div class="forgot-password-banner">
      <div class="banner-content">
        <h3>忘记密码？</h3>
        <p>别担心，我们帮您快速找回</p>
        
        <div class="security-tips">
          <div class="tip-item">
            <el-icon><Lock /></el-icon>
            <div>
              <h4>安全验证</h4>
              <p>通过邮箱验证确保账户安全</p>
            </div>
          </div>
          
          <div class="tip-item">
            <el-icon><Clock /></el-icon>
            <div>
              <h4>快速重置</h4>
              <p>几分钟内完成密码重置</p>
            </div>
          </div>
          
          <div class="tip-item">
            <el-icon><Lock /></el-icon>
            <div>
              <h4>安全保障</h4>
              <p>重置链接24小时内有效</p>
            </div>
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
import { ArrowLeft, Lock, Clock } from '@element-plus/icons-vue'

const router = useRouter()

const currentStep = ref(1)
const sendingCode = ref(false)
const resetting = ref(false)
const countdown = ref(0)

const emailFormRef = ref()
const codeFormRef = ref()
const passwordFormRef = ref()

const emailForm = reactive({
  email: ''
})

const codeForm = reactive({
  code: ''
})

const passwordForm = reactive({
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== passwordForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const emailRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

const codeRules = {
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { min: 6, max: 6, message: '验证码为6位数字', trigger: 'blur' }
  ]
}

const passwordRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const sendVerificationCode = async () => {
  if (!emailFormRef.value) return

  try {
    await emailFormRef.value.validate()
    sendingCode.value = true

    // 模拟发送验证码
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success(`验证码已发送至 ${emailForm.email}`)
    currentStep.value = 2
    startCountdown()
  } catch (error) {
    ElMessage.error('请输入有效的邮箱地址')
  } finally {
    sendingCode.value = false
  }
}

const startCountdown = () => {
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

const resendCode = () => {
  if (countdown.value > 0) return
  
  sendVerificationCode()
}

const verifyCode = async () => {
  if (!codeFormRef.value) return

  try {
    await codeFormRef.value.validate()

    // 模拟验证码验证
    if (codeForm.code !== '123456') { // 测试用验证码
      ElMessage.error('验证码错误，请重新输入')
      return
    }

    ElMessage.success('验证成功')
    currentStep.value = 3
  } catch (error) {
    ElMessage.error('请输入有效的验证码')
  }
}

const resetPassword = async () => {
  if (!passwordFormRef.value) return

  try {
    await passwordFormRef.value.validate()
    resetting.value = true

    // 模拟密码重置
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('密码重置成功，请使用新密码登录')
    router.push('/login')
  } catch (error) {
    ElMessage.error('密码重置失败，请检查输入')
  } finally {
    resetting.value = false
  }
}
</script>

<style scoped>
.forgot-password-container {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.forgot-password-form {
  flex: 1;
  max-width: 500px;
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

.steps {
  margin-bottom: 40px;
}

.step-content {
  flex: 1;
}

.step-form {
  width: 100%;
}

.submit-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
}

.code-tips {
  margin-bottom: 20px;
  padding: 0 100px;
  text-align: center;
}

.code-tips p {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
}

.back-link {
  text-align: center;
  margin-top: 30px;
}

.forgot-password-banner {
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

.security-tips {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.tip-item .el-icon {
  font-size: 24px;
  color: #52c41a;
  margin-top: 4px;
}

.tip-item h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.tip-item p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .forgot-password-container {
    flex-direction: column;
  }
  
  .forgot-password-form {
    max-width: none;
    padding: 40px 20px;
  }
  
  .forgot-password-banner {
    display: none;
  }
  
  .code-tips {
    padding: 0;
  }
}
</style>