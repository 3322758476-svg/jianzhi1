<template>
  <div class="settings-page">
    <el-card class="page-card">
      <template #header>
        <h2>账户设置</h2>
      </template>
      
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 基本信息设置 -->
        <el-tab-pane label="基本信息" name="profile">
          <el-form :model="profileForm" label-width="100px" :rules="profileRules" ref="profileFormRef">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="profileForm.username" placeholder="请输入用户名" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="profileForm.email" placeholder="请输入邮箱地址" />
            </el-form-item>
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item label="头像">
              <el-upload
                class="avatar-uploader"
                action="#"
                :show-file-list="false"
                :before-upload="beforeAvatarUpload"
                @change="handleAvatarChange"
              >
                <img v-if="profileForm.avatar" :src="profileForm.avatar" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveProfile">保存修改</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 安全设置 -->
        <el-tab-pane label="安全设置" name="security">
          <el-form :model="securityForm" label-width="100px" :rules="securityRules" ref="securityFormRef">
            <el-form-item label="当前密码" prop="currentPassword">
              <el-input v-model="securityForm.currentPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="securityForm.newPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="securityForm.confirmPassword" type="password" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="changePassword">修改密码</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 通知设置 -->
        <el-tab-pane label="通知设置" name="notifications">
          <div class="notification-settings">
            <el-checkbox-group v-model="notificationSettings">
              <el-checkbox label="message" disabled>新消息通知</el-checkbox>
              <el-checkbox label="application" disabled>申请状态变更</el-checkbox>
              <el-checkbox label="system" disabled>系统通知</el-checkbox>
              <el-checkbox label="promotion" disabled>推广信息</el-checkbox>
            </el-checkbox-group>
            <div class="setting-note">
              <el-alert title="通知功能正在完善中" type="info" :closable="false" />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useUserStore } from '../store'

const userStore = useUserStore()
const activeTab = ref('profile')
const profileFormRef = ref<FormInstance>()
const securityFormRef = ref<FormInstance>()

// 基本信息表单
const profileForm = reactive({
  username: '',
  email: '',
  phone: '',
  avatar: ''
})

// 安全设置表单
const securityForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 通知设置
const notificationSettings = ref(['message', 'application', 'system'])

// 表单验证规则
const profileRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

const securityRules: FormRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== securityForm.newPassword) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 初始化用户数据
onMounted(() => {
  if (userStore.user) {
    profileForm.username = userStore.user.username || ''
    profileForm.email = userStore.user.email || ''
    profileForm.phone = userStore.user.phone || ''
    profileForm.avatar = userStore.user.avatar || ''
  }
})

// 头像上传处理
const beforeAvatarUpload = (file: File) => {
  const isJPGOrPNG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPGOrPNG) {
    ElMessage.error('头像只能是 JPG/PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
    return false
  }
  return true
}

const handleAvatarChange = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    profileForm.avatar = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

// 保存基本信息
const saveProfile = async () => {
  if (!profileFormRef.value) return
  
  try {
    await profileFormRef.value.validate()
    
    // 模拟保存到后端
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 更新用户信息
    if (userStore.user) {
      userStore.user.username = profileForm.username
      userStore.user.email = profileForm.email
      userStore.user.phone = profileForm.phone
      userStore.user.avatar = profileForm.avatar
    }
    
    ElMessage.success('个人信息更新成功')
  } catch (error) {
    ElMessage.error('保存失败，请检查表单数据')
  }
}

// 修改密码
const changePassword = async () => {
  if (!securityFormRef.value) return
  
  try {
    await securityFormRef.value.validate()
    
    // 模拟密码修改
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 清空表单
    securityForm.currentPassword = ''
    securityForm.newPassword = ''
    securityForm.confirmPassword = ''
    
    ElMessage.success('密码修改成功')
  } catch (error) {
    ElMessage.error('密码修改失败')
  }
}
</script>

<style scoped>
.settings-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.coming-soon {
  text-align: center;
  padding: 60px 0;
}
</style>