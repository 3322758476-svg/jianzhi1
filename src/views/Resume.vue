<template>
  <div class="resume">
    <div class="page-header">
      <h1>我的简历</h1>
      <p>完善您的个人简历，提高求职成功率</p>
    </div>

    <div class="resume-content">
      <el-card class="resume-card">
        <template #header>
          <div class="card-header">
            <span>简历信息</span>
            <div class="header-actions">
              <el-button type="primary" @click="editMode = !editMode">
                {{ editMode ? '取消编辑' : '编辑简历' }}
              </el-button>
              <el-button type="success" @click="downloadResume" v-if="!editMode">
                下载简历
              </el-button>
            </div>
          </div>
        </template>

        <el-form 
          :model="resumeForm" 
          :rules="resumeRules" 
          ref="resumeFormRef"
          label-width="100px"
          v-loading="isLoading"
        >
          <!-- 基本信息 -->
          <el-form-item label="姓名" prop="name">
            <el-input 
              v-model="resumeForm.name" 
              :disabled="!editMode"
              placeholder="请输入您的姓名"
            />
          </el-form-item>

          <el-form-item label="性别" prop="gender">
            <el-radio-group v-model="resumeForm.gender" :disabled="!editMode">
              <el-radio label="male">男</el-radio>
              <el-radio label="female">女</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="出生日期" prop="birthDate">
            <el-date-picker
              v-model="resumeForm.birthDate"
              type="date"
              placeholder="选择日期"
              :disabled="!editMode"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="联系电话" prop="phone">
            <el-input 
              v-model="resumeForm.phone" 
              :disabled="!editMode"
              placeholder="请输入联系电话"
            />
          </el-form-item>

          <el-form-item label="邮箱" prop="email">
            <el-input 
              v-model="resumeForm.email" 
              :disabled="!editMode"
              placeholder="请输入邮箱地址"
            />
          </el-form-item>

          <!-- 教育背景 -->
          <el-divider content-position="left">教育背景</el-divider>
          
          <el-form-item label="学校" prop="school">
            <el-input 
              v-model="resumeForm.school" 
              :disabled="!editMode"
              placeholder="请输入学校名称"
            />
          </el-form-item>

          <el-form-item label="专业" prop="major">
            <el-input 
              v-model="resumeForm.major" 
              :disabled="!editMode"
              placeholder="请输入专业名称"
            />
          </el-form-item>

          <el-form-item label="学历" prop="education">
            <el-select 
              v-model="resumeForm.education" 
              :disabled="!editMode"
              placeholder="请选择学历"
              style="width: 100%"
            >
              <el-option label="本科" value="bachelor" />
              <el-option label="硕士" value="master" />
              <el-option label="博士" value="doctor" />
              <el-option label="专科" value="college" />
            </el-select>
          </el-form-item>

          <el-form-item label="入学时间" prop="enrollmentDate">
            <el-date-picker
              v-model="resumeForm.enrollmentDate"
              type="month"
              placeholder="选择月份"
              :disabled="!editMode"
              style="width: 100%"
            />
          </el-form-item>

          <!-- 技能特长 -->
          <el-divider content-position="left">技能特长</el-divider>
          
          <el-form-item label="专业技能" prop="skills">
            <el-input
              type="textarea"
              :rows="3"
              v-model="resumeForm.skills"
              :disabled="!editMode"
              placeholder="请描述您的专业技能，如：熟练掌握Vue.js、React等前端框架，了解Node.js后端开发..."
            />
          </el-form-item>

          <el-form-item label="语言能力" prop="languages">
            <el-input
              type="textarea"
              :rows="2"
              v-model="resumeForm.languages"
              :disabled="!editMode"
              placeholder="请描述您的语言能力，如：英语CET-6，能够流利阅读英文文档..."
            />
          </el-form-item>

          <!-- 工作经历 -->
          <el-divider content-position="left">工作经历</el-divider>
          
          <el-form-item label="实习经历" prop="internships">
            <el-input
              type="textarea"
              :rows="4"
              v-model="resumeForm.internships"
              :disabled="!editMode"
              placeholder="请描述您的实习经历，包括公司名称、职位、工作内容和收获..."
            />
          </el-form-item>

          <el-form-item label="项目经验" prop="projects">
            <el-input
              type="textarea"
              :rows="4"
              v-model="resumeForm.projects"
              :disabled="!editMode"
              placeholder="请描述您参与的项目经验，包括项目名称、技术栈、个人贡献..."
            />
          </el-form-item>

          <!-- 自我评价 -->
          <el-divider content-position="left">自我评价</el-divider>
          
          <el-form-item label="个人简介" prop="introduction">
            <el-input
              type="textarea"
              :rows="4"
              v-model="resumeForm.introduction"
              :disabled="!editMode"
              placeholder="请简要介绍您的个人特点、职业目标等..."
            />
          </el-form-item>

          <!-- 简历文件上传 -->
          <el-divider content-position="left">简历文件上传</el-divider>
          
          <el-form-item label="上传简历文件">
            <el-upload
              class="resume-uploader"
              action="#"
              :show-file-list="false"
              :before-upload="beforeResumeUpload"
              :http-request="handleResumeUpload"
              accept=".pdf,.doc,.docx,.txt"
              :disabled="!editMode"
            >
              <el-button type="primary" :disabled="!editMode">
                <el-icon><Upload /></el-icon>
                选择简历文件
              </el-button>
              <template #tip>
                <div class="el-upload__tip">
                  支持 PDF、Word、TXT 格式，文件大小不超过 5MB
                </div>
              </template>
            </el-upload>
            
            <div v-if="uploadedResumeUrl" class="uploaded-resume">
              <el-icon><Document /></el-icon>
              <span class="resume-name">{{ uploadedResumeName }}</span>
              <el-button type="text" @click="downloadUploadedResume">下载</el-button>
              <el-button type="text" @click="removeUploadedResume" v-if="editMode">删除</el-button>
            </div>
          </el-form-item>

          <!-- 操作按钮 -->
          <el-form-item v-if="editMode">
            <el-button type="primary" @click="saveResume">保存简历</el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>

        <!-- 简历预览 -->
        <div v-if="!editMode" class="resume-preview">
          <el-divider content-position="left">简历预览</el-divider>
          <div class="preview-content">
            <h3>{{ resumeForm.name }} - 个人简历</h3>
            <p><strong>基本信息：</strong>{{ resumeForm.gender === 'male' ? '男' : '女' }} | {{ resumeForm.birthDate }} | {{ resumeForm.phone }} | {{ resumeForm.email }}</p>
            <p><strong>教育背景：</strong>{{ resumeForm.school }} | {{ resumeForm.major }} | {{ resumeForm.education }}</p>
            <p><strong>专业技能：</strong>{{ resumeForm.skills }}</p>
            <p><strong>语言能力：</strong>{{ resumeForm.languages }}</p>
            <p><strong>实习经历：</strong>{{ resumeForm.internships }}</p>
            <p><strong>项目经验：</strong>{{ resumeForm.projects }}</p>
            <p><strong>自我评价：</strong>{{ resumeForm.introduction }}</p>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { supabase } from '../lib/supabase'
import { useUserStore } from '../store'
import {
  Upload,
  Document
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const editMode = ref(false)
const isLoading = ref(false)
const resumeFormRef = ref<FormInstance>()

// 简历文件上传相关
const uploadedResumeUrl = ref('')
const uploadedResumeName = ref('')

interface ResumeForm {
  name: string
  gender: string
  birthDate: string
  phone: string
  email: string
  school: string
  major: string
  education: string
  enrollmentDate: string
  skills: string
  languages: string
  internships: string
  projects: string
  introduction: string
}

const resumeForm = reactive<ResumeForm>({
  name: '',
  gender: 'male',
  birthDate: '',
  phone: '',
  email: '',
  school: '',
  major: '',
  education: 'bachelor',
  enrollmentDate: '',
  skills: '',
  languages: '',
  internships: '',
  projects: '',
  introduction: ''
})

const resumeRules: FormRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  school: [
    { required: true, message: '请输入学校名称', trigger: 'blur' }
  ],
  major: [
    { required: true, message: '请输入专业名称', trigger: 'blur' }
  ]
}

// 简历文件上传验证
const beforeResumeUpload = (file: File) => {
  const isPDF = file.type === 'application/pdf'
  const isWord = file.type === 'application/msword' || 
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  const isText = file.type === 'text/plain'
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isPDF && !isWord && !isText) {
    ElMessage.error('简历文件只能是 PDF、Word 或 TXT 格式!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('简历文件大小不能超过 5MB!')
    return false
  }
  return true
}

// 处理简历文件上传
const handleResumeUpload = async (options: any) => {
  const file = options.file
  
  try {
    isLoading.value = true
    
    // 生成唯一的文件名
    const fileExt = file.name.split('.').pop()
    const fileName = `${userStore.user?.id}_${Date.now()}.${fileExt}`
    const filePath = `resumes/${fileName}`
    
    // 上传文件到 Supabase Storage
    const { data, error } = await supabase.storage
      .from('resumes')
      .upload(filePath, file)
    
    if (error) throw error
    
    // 获取文件公开 URL
    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath)
    
    uploadedResumeUrl.value = publicUrl
    uploadedResumeName.value = file.name
    
    ElMessage.success('简历文件上传成功')
  } catch (error: any) {
    console.error('上传简历文件失败:', error)
    ElMessage.error('上传简历文件失败，请重试')
  } finally {
    isLoading.value = false
  }
}

// 下载已上传的简历文件
const downloadUploadedResume = () => {
  if (uploadedResumeUrl.value) {
    window.open(uploadedResumeUrl.value, '_blank')
  }
}

// 删除已上传的简历文件
const removeUploadedResume = async () => {
  try {
    if (uploadedResumeUrl.value) {
      // 从 URL 中提取文件路径
      const urlParts = uploadedResumeUrl.value.split('/')
      const fileName = urlParts[urlParts.length - 1]
      const filePath = `resumes/${fileName}`
      
      const { error } = await supabase.storage
        .from('resumes')
        .remove([filePath])
      
      if (error) throw error
      
      uploadedResumeUrl.value = ''
      uploadedResumeName.value = ''
      
      ElMessage.success('简历文件已删除')
    }
  } catch (error: any) {
    console.error('删除简历文件失败:', error)
    ElMessage.error('删除简历文件失败，请重试')
  }
}

// 保存简历信息
const saveResume = async () => {
  if (!resumeFormRef.value) return

  try {
    await resumeFormRef.value.validate()
    isLoading.value = true
    
    // 获取当前用户的学生信息
    const { data: studentData } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userStore.user?.id)
      .single()
    
    if (!studentData) {
      throw new Error('未找到学生信息，请先完善个人信息')
    }
    
    // 更新学生信息，包括简历文件 URL
    const updateData: any = {
      real_name: resumeForm.name,
      phone: resumeForm.phone,
      school: resumeForm.school,
      major: resumeForm.major,
      skills: resumeForm.skills ? [resumeForm.skills] : [],
      experience: resumeForm.internships,
      updated_at: new Date().toISOString()
    }
    
    // 如果有上传的简历文件，更新简历 URL
    if (uploadedResumeUrl.value) {
      updateData.resume_url = uploadedResumeUrl.value
    }
    
    const { error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', studentData.id)
    
    if (error) throw error
    
    ElMessage.success('简历保存成功')
    editMode.value = false
  } catch (error: any) {
    console.error('保存简历失败:', error)
    ElMessage.error(error.message || '请完善必填信息')
  } finally {
    isLoading.value = false
  }
}

// 重置表单
const resetForm = () => {
  if (resumeFormRef.value) {
    resumeFormRef.value.resetFields()
  }
}

// 下载文本简历
const downloadResume = () => {
  try {
    // 创建文本格式的简历内容
    const resumeContent = `
个人简历

基本信息：
姓名：${resumeForm.name}
性别：${resumeForm.gender === 'male' ? '男' : '女'}
出生日期：${resumeForm.birthDate}
联系电话：${resumeForm.phone}
邮箱：${resumeForm.email}

教育背景：
学校：${resumeForm.school}
专业：${resumeForm.major}
学历：${resumeForm.education}
入学时间：${resumeForm.enrollmentDate}

专业技能：
${resumeForm.skills}

语言能力：
${resumeForm.languages}

实习经历：
${resumeForm.internships}

项目经验：
${resumeForm.projects}

自我评价：
${resumeForm.introduction}
    `.trim()
    
    // 创建文本文件下载
    const blob = new Blob([resumeContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${resumeForm.name}_简历.txt`
    a.click()
    URL.revokeObjectURL(url)
    
    ElMessage.success('简历下载成功')
  } catch (error) {
    console.error('下载简历失败:', error)
    ElMessage.error('下载简历失败，请重试')
  }
}

// 加载用户简历数据
const loadResumeData = async () => {
  try {
    isLoading.value = true
    
    // 获取当前用户的学生信息
    const { data: studentData, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userStore.user?.id)
      .single()
    
    if (error) throw error
    
    if (studentData) {
      // 填充表单数据
      Object.assign(resumeForm, {
        name: studentData.real_name || '',
        gender: 'male', // 默认值
        birthDate: '', // 需要额外字段
        phone: studentData.phone || '',
        email: userStore.user?.email || '',
        school: studentData.school || '',
        major: studentData.major || '',
        education: 'bachelor', // 默认值
        enrollmentDate: '', // 需要额外字段
        skills: studentData.skills?.join(', ') || '',
        languages: '', // 需要额外字段
        internships: studentData.experience || '',
        projects: '', // 需要额外字段
        introduction: '' // 需要额外字段
      })
      
      // 加载简历文件信息
      if (studentData.resume_url) {
        uploadedResumeUrl.value = studentData.resume_url
        // 从 URL 中提取文件名
        const urlParts = studentData.resume_url.split('/')
        uploadedResumeName.value = urlParts[urlParts.length - 1] || '简历文件'
      }
    }
  } catch (error: any) {
    console.error('加载简历数据失败:', error)
    // 如果学生信息不存在，使用默认数据
    if (error.code === 'PGRST116') {
      Object.assign(resumeForm, {
        name: userStore.user?.username || '',
        email: userStore.user?.email || '',
        phone: userStore.user?.phone || ''
      })
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (userStore.isAuthenticated) {
    loadResumeData()
    // 检查是否从个人中心跳转过来，如果是则自动进入编辑模式
    const fromProfile = document.referrer.includes('/profile')
    if (fromProfile) {
      editMode.value = true
    }
  } else {
    ElMessage.warning('请先登录后再编辑简历')
    router.push('/login')
  }
})
</script>

<style scoped>
.resume {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 10px;
}

.page-header p {
  color: #666;
  font-size: 1.1rem;
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

.resume-uploader {
  width: 100%;
}

.uploaded-resume {
  margin-top: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.resume-name {
  flex: 1;
  color: #666;
}

.resume-preview {
  margin-top: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.preview-content h3 {
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.preview-content p {
  margin-bottom: 10px;
  line-height: 1.6;
  color: #666;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .resume {
    padding: 10px;
  }
}
</style>