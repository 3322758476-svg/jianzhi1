<template>
  <div class="register-container">
    <div class="register-form">
      <div class="form-header">
        <h2>注册大学生兼职平台</h2>
        <p>创建您的账户，开启兼职之旅</p>
      </div>

      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        label-width="100px"
        class="register-form-content"
      >
        <el-form-item label="用户类型" prop="userType">
          <el-radio-group v-model="registerForm.userType">
            <el-radio label="student">学生用户</el-radio>
            <el-radio label="company">企业用户</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 学生用户信息 -->
        <template v-if="registerForm.userType === 'student'">
          <el-form-item label="姓名" prop="name">
            <el-input
              v-model="registerForm.name"
              placeholder="请输入真实姓名"
              size="large"
            />
          </el-form-item>

          <el-form-item label="学号" prop="studentId">
            <el-input
              v-model="registerForm.studentId"
              placeholder="请输入学号"
              size="large"
            />
          </el-form-item>

          <el-form-item label="学校" prop="school">
            <el-input
              v-model="registerForm.school"
              placeholder="请输入所在学校"
              size="large"
            />
          </el-form-item>

          <el-form-item label="专业" prop="major">
            <el-input
              v-model="registerForm.major"
              placeholder="请输入专业"
              size="large"
            />
          </el-form-item>
        </template>

        <!-- 企业用户信息 -->
        <template v-else-if="registerForm.userType === 'company'">
          <el-form-item label="企业名称" prop="companyName">
            <el-input
              v-model="registerForm.companyName"
              placeholder="请输入企业全称"
              size="large"
            />
          </el-form-item>

          <el-form-item label="营业执照" prop="license">
            <el-input
              v-model="registerForm.license"
              placeholder="请输入营业执照编号"
              size="large"
            />
          </el-form-item>

          <el-form-item label="联系人" prop="contactPerson">
            <el-input
              v-model="registerForm.contactPerson"
              placeholder="请输入联系人姓名"
              size="large"
            />
          </el-form-item>

          <el-form-item label="联系电话" prop="contactPhone">
            <el-input
              v-model="registerForm.contactPhone"
              placeholder="请输入联系电话"
              size="large"
            />
          </el-form-item>
        </template>

        <!-- 通用信息 -->
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="请输入邮箱地址"
            size="large"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="agreeTerms">
            我已阅读并同意
            <el-link type="primary" @click="showTerms">《用户协议》</el-link>
            和
            <el-link type="primary" @click="showPrivacy">《隐私政策》</el-link>
          </el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="register-btn"
            :loading="loading"
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form-item>

        <div class="login-link">
          已有账户？
          <el-link type="primary" @click="handleLogin">立即登录</el-link>
        </div>
      </el-form>
    </div>

    <div class="register-banner">
      <div class="banner-content">
        <h3>加入大学生兼职平台</h3>
        <p>开启您的职业发展新篇章</p>
        
        <div class="benefits">
          <div class="benefit-item">
            <el-icon><User /></el-icon>
            <div>
              <h4>个性化推荐</h4>
              <p>根据您的专业和兴趣推荐合适岗位</p>
            </div>
          </div>
          
          <div class="benefit-item">
            <el-icon><Lock /></el-icon>
            <div>
              <h4>安全保障</h4>
              <p>企业实名认证，岗位信息严格审核</p>
            </div>
          </div>
          
          <div class="benefit-item">
            <el-icon><TrendCharts /></el-icon>
            <div>
              <h4>职业发展</h4>
              <p>积累工作经验，提升就业竞争力</p>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../store'
import { User, TrendCharts, Lock } from '@element-plus/icons-vue'
import { sendWelcomeEmail, resendVerificationEmail } from '../utils/email-service'

const router = useRouter()
const userStore = useUserStore()

const registerFormRef = ref()
const loading = ref(false)
const agreeTerms = ref(false)

const registerForm = reactive({
  userType: 'student',
  name: '',
  studentId: '',
  school: '',
  major: '',
  companyName: '',
  license: '',
  contactPerson: '',
  contactPhone: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const registerRules = {
  userType: [
    { required: true, message: '请选择用户类型', trigger: 'change' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  studentId: [
    { required: true, message: '请输入学号', trigger: 'blur' }
  ],
  school: [
    { required: true, message: '请输入学校', trigger: 'blur' }
  ],
  major: [
    { required: true, message: '请输入专业', trigger: 'blur' }
  ],
  companyName: [
    { required: true, message: '请输入企业名称', trigger: 'blur' }
  ],
  license: [
    { required: true, message: '请输入营业执照编号', trigger: 'blur' }
  ],
  contactPerson: [
    { required: true, message: '请输入联系人', trigger: 'blur' }
  ],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const showTerms = () => {
  ElMessageBox.alert('用户协议内容...', '用户协议', {
    confirmButtonText: '确定',
    customClass: 'terms-dialog'
  })
}

const showPrivacy = () => {
  ElMessageBox.alert('隐私政策内容...', '隐私政策', {
    confirmButtonText: '确定',
    customClass: 'privacy-dialog'
  })
}

const handleRegister = async () => {
  if (!registerFormRef.value) return

  if (!agreeTerms.value) {
    ElMessage.warning('请阅读并同意用户协议和隐私政策')
    return
  }

  try {
    await registerFormRef.value.validate()
    loading.value = true

    // 注册逻辑
    const result = await userStore.register(registerForm)

    if (result.success) {
      // 发送欢迎邮件
      const emailResult = await sendWelcomeEmail(
        registerForm.email,
        registerForm.name || registerForm.companyName || registerForm.email.split('@')[0],
        registerForm.userType
      )

      if (result.requiresEmailConfirmation) {
        if (emailResult.success) {
          ElMessage.success({
            message: '注册成功！验证邮件已发送到您的邮箱，请检查并验证邮箱地址后登录',
            duration: 5000
          })
        } else {
          ElMessage.success({
            message: '注册成功！请检查您的邮箱并验证邮箱地址后登录',
            duration: 5000
          })
        }
        // 跳转到登录页面
        router.push('/login')
      } else {
        ElMessage.success('注册成功！已自动登录')
        // 注册成功后直接跳转到首页
        router.push('/')
      }
    } else {
      ElMessage.error('注册失败，请检查输入信息')
    }
  } catch (error) {
    console.error('注册失败:', error)
    ElMessage.error('注册失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 重新发送验证邮件
const handleResendVerification = async () => {
  try {
    const result = await resendVerificationEmail(registerForm.email)
    if (result.success) {
      ElMessage.success('验证邮件已重新发送，请检查您的邮箱')
    } else {
      ElMessage.error('重新发送验证邮件失败，请稍后重试')
    }
  } catch (error) {
    ElMessage.error('重新发送验证邮件失败')
  }
}

const handleLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.register-container {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-form {
  flex: 1;
  max-width: 600px;
  background: white;
  padding: 60px 40px;
  overflow-y: auto;
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

.register-form-content {
  width: 100%;
}

.register-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
}

.login-link {
  text-align: center;
  color: #666;
  font-size: 14px;
  margin-top: 20px;
}

.register-banner {
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

.benefits {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.benefit-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.benefit-item .el-icon {
  font-size: 24px;
  color: #52c41a;
  margin-top: 4px;
}

.benefit-item h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.benefit-item p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .register-container {
    flex-direction: column;
  }
  
  .register-form {
    max-width: none;
    padding: 40px 20px;
  }
  
  .register-banner {
    display: none;
  }
}

:deep(.terms-dialog) {
  max-width: 600px;
}

:deep(.privacy-dialog) {
  max-width: 600px;
}
</style>