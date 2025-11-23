<template>
  <div class="company-layout">
    <CompanySidebar />
    
    <div class="company-main">
      <div class="company-header">
        <div class="header-left">
          <h1>企业资料设置</h1>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/company/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item :to="{ path: '/company/settings' }">企业设置</el-breadcrumb-item>
            <el-breadcrumb-item>企业资料</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="saveProfile">
            <el-icon><Check /></el-icon>
            保存资料
          </el-button>
        </div>
      </div>

      <div class="profile-container">
        <el-card>
          <template #header>
            <span>基本信息</span>
          </template>
          
          <el-form :model="profileForm" label-width="120px" :rules="profileRules" ref="profileFormRef">
            <el-form-item label="企业名称" prop="name">
              <el-input v-model="profileForm.name" placeholder="请输入企业名称" />
            </el-form-item>
            
            <el-form-item label="企业Logo" prop="logo">
              <el-upload
                class="avatar-uploader"
                action="#"
                :show-file-list="false"
                :before-upload="beforeAvatarUpload"
                :http-request="handleAvatarUpload"
              >
                <img v-if="profileForm.logo" :src="profileForm.logo" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
            
            <el-form-item label="所属行业" prop="industry">
              <el-select v-model="profileForm.industry" placeholder="请选择行业" style="width: 100%">
                <el-option label="互联网/IT" value="互联网/IT" />
                <el-option label="金融/银行" value="金融/银行" />
                <el-option label="教育/培训" value="教育/培训" />
                <el-option label="医疗/健康" value="医疗/健康" />
                <el-option label="制造业" value="制造业" />
                <el-option label="零售/电商" value="零售/电商" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="企业规模" prop="scale">
              <el-select v-model="profileForm.scale" placeholder="请选择企业规模" style="width: 100%">
                <el-option label="1-50人" value="1-50人" />
                <el-option label="50-200人" value="50-200人" />
                <el-option label="200-500人" value="200-500人" />
                <el-option label="500-1000人" value="500-1000人" />
                <el-option label="1000人以上" value="1000人以上" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="企业简介" prop="description">
              <el-input
                v-model="profileForm.description"
                type="textarea"
                :rows="4"
                placeholder="请输入企业简介"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
            
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="profileForm.phone" placeholder="请输入联系电话" />
            </el-form-item>
            
            <el-form-item label="邮箱地址" prop="email">
              <el-input v-model="profileForm.email" placeholder="请输入邮箱地址" />
            </el-form-item>
            
            <el-form-item label="公司地址" prop="address">
              <el-input v-model="profileForm.address" placeholder="请输入公司地址" />
            </el-form-item>
            
            <el-form-item label="官方网站" prop="website">
              <el-input v-model="profileForm.website" placeholder="请输入官方网站地址" />
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import CompanySidebar from '../components/CompanySidebar.vue'
import { Check, Plus } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, FormRules } from 'element-plus'

interface ProfileForm {
  name: string
  logo: string
  industry: string
  scale: string
  description: string
  phone: string
  email: string
  address: string
  website: string
}

const profileFormRef = ref<FormInstance>()
const profileForm = reactive<ProfileForm>({
  name: '',
  logo: '',
  industry: '',
  scale: '',
  description: '',
  phone: '',
  email: '',
  address: '',
  website: ''
})

const profileRules: FormRules = {
  name: [
    { required: true, message: '请输入企业名称', trigger: 'blur' }
  ],
  industry: [
    { required: true, message: '请选择所属行业', trigger: 'change' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

const loadProfile = async () => {
  try {
    // 模拟加载企业资料
    Object.assign(profileForm, {
      name: '示例科技有限公司',
      logo: '',
      industry: '互联网/IT',
      scale: '50-200人',
      description: '一家专注于技术创新的科技公司',
      phone: '13800138000',
      email: 'contact@example.com',
      address: '北京市朝阳区科技园区',
      website: 'https://www.example.com'
    })
  } catch (error) {
    console.error('加载企业资料失败:', error)
  }
}

const saveProfile = async () => {
  if (!profileFormRef.value) return
  
  try {
    await profileFormRef.value.validate()
    console.log('保存企业资料:', profileForm)
    // 这里应该调用API保存数据
  } catch (error) {
    console.error('保存失败:', error)
  }
}

const beforeAvatarUpload = (file: File) => {
  const isJPG = file.type === 'image/jpeg'
  const isPNG = file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG && !isPNG) {
    ElMessage.error('头像只能是 JPG/PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
    return false
  }
  return true
}

const handleAvatarUpload = async (options: any) => {
  console.log('上传头像:', options)
  // 这里应该实现文件上传逻辑
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
@import '@/assets/styles/common.css';
.profile-container {
  padding: 24px;
}

.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  width: 120px;
  height: 120px;
}

.avatar-uploader:hover {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  line-height: 120px;
  text-align: center;
}

.avatar {
  width: 120px;
  height: 120px;
  display: block;
}
</style>