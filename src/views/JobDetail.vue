<template>
  <div class="job-detail-page">
    <div class="container">
      <!-- 返回按钮 -->
      <div class="back-section">
        <el-button @click="$router.back()" type="text">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
      </div>

      <!-- 岗位详情卡片 -->
      <el-card class="job-card">
        <template #header>
          <div class="job-header">
            <div class="job-title-section">
              <h1>{{ job.title }}</h1>
              <div class="job-meta">
                <el-tag type="primary">{{ job.company }}</el-tag>
                <el-tag>{{ job.location }}</el-tag>
                <el-tag type="success">{{ job.salary }}</el-tag>
              </div>
            </div>
            
            <div class="job-actions">
              <el-button 
                v-if="userStore.isAuthenticated && userStore.user?.role === 'student'"
                type="primary" 
                size="large"
                @click="handleApply"
                :loading="applying"
              >
                <el-icon><DocumentAdd /></el-icon>
                立即申请
              </el-button>
              
              <el-button 
                type="info" 
                size="large"
                @click="toggleFavorite"
              >
                <el-icon :color="isFavorite ? '#f56c6c' : ''">
                  {{ isFavorite ? 'StarFilled' : 'Star' }}
                </el-icon>
                {{ isFavorite ? '已收藏' : '收藏' }}
              </el-button>
            </div>
          </div>
        </template>

        <div class="job-content">
          <!-- 基本信息 -->
          <div class="info-section">
            <h3>岗位信息</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">工作地点：</span>
                <span class="value">{{ job.location }}</span>
              </div>
              <div class="info-item">
                <span class="label">薪资范围：</span>
                <span class="value">{{ job.salary }}</span>
              </div>
              <div class="info-item">
                <span class="label">工作时间：</span>
                <span class="value">{{ job.workTime }}</span>
              </div>
              <div class="info-item">
                <span class="label">招聘人数：</span>
                <span class="value">{{ job.recruitCount }}人</span>
              </div>
              <div class="info-item">
                <span class="label">发布时间：</span>
                <span class="value">{{ job.publishTime }}</span>
              </div>
              <div class="info-item">
                <span class="label">申请人数：</span>
                <span class="value">{{ job.applicationCount }}人</span>
              </div>
            </div>
          </div>

          <!-- 岗位描述 -->
          <div class="description-section">
            <h3>岗位描述</h3>
            <div class="description-content">
              {{ job.description }}
            </div>
          </div>

          <!-- 岗位要求 -->
          <div class="requirements-section">
            <h3>岗位要求</h3>
            <ul class="requirements-list">
              <li v-for="(requirement, index) in job.requirements" :key="index">
                {{ requirement }}
              </li>
            </ul>
          </div>

          <!-- 岗位标签 -->
          <div class="tags-section">
            <h3>岗位标签</h3>
            <div class="tags-list">
              <el-tag 
                v-for="tag in job.tags" 
                :key="tag"
                type="info"
                class="tag-item"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>

          <!-- 公司信息 -->
          <div class="company-section">
            <h3>公司信息</h3>
            <div class="company-info">
              <div class="company-header">
                <el-avatar :size="60" :src="job.companyLogo" />
                <div class="company-details">
                  <h4>{{ job.company }}</h4>
                  <p class="company-industry">{{ job.industry }}</p>
                  <p class="company-size">规模：{{ job.companySize }}</p>
                </div>
              </div>
              <p class="company-description">{{ job.companyDescription }}</p>
            </div>
          </div>

          <!-- 地图定位 -->
          <div class="map-section">
            <h3>工作地点</h3>
            <div class="map-placeholder">
              <el-empty description="地图功能开发中">
                <p>地址：{{ job.address }}</p>
              </el-empty>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 申请弹窗 -->
      <el-dialog
        v-model="applyDialogVisible"
        title="申请岗位"
        width="500px"
      >
        <el-form :model="applyForm" label-width="80px">
          <el-form-item label="简历">
            <el-select v-model="applyForm.resumeId" placeholder="选择简历" style="width: 100%">
              <el-option 
                v-for="resume in resumes" 
                :key="resume.id"
                :label="resume.title" 
                :value="resume.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="申请说明">
            <el-input
              v-model="applyForm.message"
              type="textarea"
              :rows="3"
              placeholder="请输入申请说明（可选）"
            />
          </el-form-item>
        </el-form>
        
        <template #footer>
          <el-button @click="applyDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitApplication" :loading="applying">
            提交申请
          </el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../store'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft,
  DocumentAdd,
  Star,
  StarFilled
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const jobId = computed(() => route.params.id as string)

// 加载状态
const loading = ref(false)

// 岗位数据
const job = ref({
  id: '',
  title: '',
  company: '',
  location: '',
  salary: '',
  workTime: '',
  recruitCount: 0,
  applicationCount: 0,
  publishTime: '',
  description: '',
  requirements: [],
  tags: [],
  companyLogo: '',
  industry: '',
  companySize: '',
  companyDescription: '',
  address: ''
})

// 申请相关
const applying = ref(false)
const applyDialogVisible = ref(false)
const isFavorite = ref(false)

const applyForm = reactive({
  resumeId: '',
  message: ''
})

// 简历数据
const resumes = ref([])

// 加载用户简历数据
const loadUserResumes = async () => {
  try {
    resumes.value = []
    
    // 获取当前用户的学生信息
    const { data: studentData, error } = await supabase
      .from('students')
      .select('id, real_name, resume_url')
      .eq('user_id', userStore.user?.id)
      .single()
    
    if (error) {
      console.warn('获取学生信息失败，使用默认简历选项:', error)
      // 使用默认简历选项
      resumes.value = [
        { id: 'text_resume', title: '文本简历', url: null }
      ]
      return
    }
    
    if (studentData) {
      // 如果有上传的简历文件，添加到简历列表
      if (studentData.resume_url) {
        resumes.value.push({
          id: 'uploaded_resume',
          title: `${studentData.real_name || '我的'}简历文件`,
          url: studentData.resume_url
        })
      }
      
      // 添加文本简历选项
      resumes.value.push({
        id: 'text_resume',
        title: '文本简历',
        url: null
      })
    } else {
      // 如果没有学生信息，使用默认简历选项
      resumes.value = [
        { id: 'text_resume', title: '文本简历', url: null }
      ]
    }
  } catch (error: any) {
    console.error('加载简历数据失败:', error)
    // 如果加载失败，使用默认选项
    resumes.value = [
      { id: 'text_resume', title: '文本简历', url: null }
    ]
  }
}

const handleApply = async () => {
  if (!userStore.isAuthenticated) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  if (userStore.user?.role !== 'student') {
    ElMessage.warning('只有学生用户可以申请岗位')
    return
  }
  
  // 加载用户简历数据
  await loadUserResumes()
  
  // 检查是否有简历可用
  if (resumes.value.length === 0) {
    ElMessage.warning('请先完善简历信息')
    router.push('/profile/resume')
    return
  }
  
  applyDialogVisible.value = true
}

const submitApplication = async () => {
  if (!applyForm.resumeId) {
    ElMessage.warning('请选择简历')
    return
  }
  
  applying.value = true
  
  try {
    // 获取当前用户的学生信息
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id, real_name')
      .eq('user_id', userStore.user?.id)
      .single()
    
    if (studentError) throw studentError
    
    if (!studentData) {
      ElMessage.error('请先完善个人信息')
      return
    }
    
    // 先检查是否已经申请过该岗位
    const { data: existingApplication, error: checkError } = await supabase
      .from('applications')
      .select('id, status')
      .eq('job_id', jobId.value)
      .eq('student_id', studentData.id)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 表示没有找到记录，这是正常的
      throw checkError
    }
    
    if (existingApplication) {
      ElMessage.warning(`您已经申请过该岗位，当前状态：${existingApplication.status}`)
      applyDialogVisible.value = false
      applying.value = false
      return
    }
    
    // 获取选择的简历信息
    const selectedResume = resumes.value.find(r => r.id === applyForm.resumeId)
    
    // 创建申请记录
    const { data: applicationData, error: applicationError } = await supabase
      .from('applications')
      .insert({
        job_id: jobId.value,
        student_id: studentData.id,
        cover_letter: applyForm.message || '',
        resume_url: selectedResume?.url || null,
        status: 'pending',
        applied_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (applicationError) throw applicationError
    
    // 发送通知给公司（这里可以集成邮件或消息系统）
    await sendApplicationNotification(applicationData.id, studentData.real_name)
    
    ElMessage.success('申请提交成功！公司将会收到您的申请通知')
    applyDialogVisible.value = false
    
    // 更新申请人数
    job.value.applicationCount++
    
    // 重置表单
    applyForm.resumeId = ''
    applyForm.message = ''
  } catch (error: any) {
    console.error('申请提交失败:', error)
    ElMessage.error(error.message || '申请提交失败，请重试')
  } finally {
    applying.value = false
  }
}

// 发送申请通知给公司
const sendApplicationNotification = async (applicationId: string, studentName: string) => {
  try {
    // 获取岗位信息
    const { data: jobData } = await supabase
      .from('jobs')
      .select('title, company_id')
      .eq('id', jobId.value)
      .single()
    
    if (!jobData) return
    
    // 获取公司信息
    const { data: companyData } = await supabase
      .from('companies')
      .select('company_name, user_id')
      .eq('id', jobData.company_id)
      .single()
    
    if (!companyData) return
    
    // 这里可以集成邮件通知、站内信、或实时消息
    console.log(`发送申请通知：学生 ${studentName} 申请了岗位 "${jobData.title}"`)
    
    // 实际项目中，这里可以调用邮件服务或消息服务
    // 例如：await emailService.sendApplicationNotification(companyData.user_id, applicationId)
    
  } catch (error) {
    console.warn('发送通知失败:', error)
    // 通知失败不影响申请流程
  }
}

const toggleFavorite = () => {
  if (!userStore.isAuthenticated) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  isFavorite.value = !isFavorite.value
  
  if (isFavorite.value) {
    ElMessage.success('已添加到收藏')
  } else {
    ElMessage.info('已取消收藏')
  }
}

// 加载岗位详情数据
const loadJobDetail = async () => {
  try {
    loading.value = true
    
    // 从Supabase数据库加载岗位详情
    const { data: jobData, error } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        salary_range,
        work_location,
        description,
        created_at,
        company_id,
        work_hours,
        job_type,
        category,
        skills_required,
        recruit_count
      `)
      .eq('id', jobId.value)
      .single()
    
    if (error) {
      console.error('加载岗位详情失败:', error)
      // 降级处理：使用默认数据
      job.value = getFallbackJobData()
      return
    }
    
    if (jobData) {
      // 获取公司信息
      let companyInfo = { name: '招聘公司', industry: '其他' }
      try {
        const { data: companyData } = await supabase
          .from('companies')
          .select('company_name, industry')
          .eq('id', jobData.company_id)
          .single()
        
        if (companyData) {
          companyInfo = {
            name: companyData.company_name || '招聘公司',
            industry: companyData.industry || '其他'
          }
        }
      } catch (companyError) {
        console.warn('获取公司信息失败:', companyError)
      }
      
      // 获取申请人数统计
      let applicationCount = 0
      try {
        const { data: applicationsData } = await supabase
          .from('applications')
          .select('id')
          .eq('job_id', jobData.id)
        
        applicationCount = applicationsData?.length || 0
      } catch (appError) {
        console.warn('获取申请人数失败:', appError)
      }
      
      // 格式化时间
      const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        
        if (diffHours < 1) return '刚刚'
        if (diffHours < 24) return `${diffHours}小时前`
        return `${Math.floor(diffHours / 24)}天前`
      }
      
      // 转换数据格式
      job.value = {
        id: jobData.id,
        title: jobData.title || '岗位标题',
        company: companyInfo.name,
        location: jobData.work_location || '工作地点待定',
        salary: jobData.salary_range || '面议',
        workTime: jobData.work_hours || '工作时间待定',
        recruitCount: jobData.recruit_count || 1,
        applicationCount: applicationCount,
        publishTime: formatTimeAgo(jobData.created_at),
        description: jobData.description || '暂无描述',
        requirements: jobData.skills_required ? 
          (Array.isArray(jobData.skills_required) ? jobData.skills_required : [jobData.skills_required]) : [],
        tags: jobData.skills_required ? 
          (Array.isArray(jobData.skills_required) ? jobData.skills_required : [jobData.skills_required]) : [],
        companyLogo: '',
        industry: companyInfo.industry,
        companySize: '',
        companyDescription: '',
        address: jobData.work_location || ''
      }
    } else {
      ElMessage.error('岗位不存在')
      // 降级处理：使用默认数据
      job.value = getFallbackJobData()
    }
    
  } catch (error) {
    console.error('加载岗位详情失败:', error)
    ElMessage.error('加载岗位详情失败')
    
    // 降级处理：使用默认数据
    job.value = getFallbackJobData()
  } finally {
    loading.value = false
  }
}

// 降级处理：获取默认岗位数据
const getFallbackJobData = () => ({
  id: jobId.value,
  title: '前端开发实习生',
  company: '腾讯科技',
  location: '深圳·南山区',
  salary: '200-300元/天',
  workTime: '每周3-5天',
  recruitCount: 5,
  applicationCount: 0,
  publishTime: '2小时前',
  description: '负责公司产品的前端开发工作，参与需求讨论和技术方案设计。',
  requirements: ['熟悉HTML/CSS/JavaScript', '了解React或Vue框架', '有良好的学习能力'],
  tags: ['React', 'Vue', 'TypeScript'],
  companyLogo: '',
  industry: '互联网',
  companySize: '1000人以上',
  companyDescription: '腾讯是一家世界领先的互联网科技公司，专注于社交平台、数字内容、金融科技等领域。',
  address: '深圳市南山区科技园'
})

onMounted(() => {
  // 根据jobId加载岗位数据
  loadJobDetail()
})
</script>

<style scoped>
.job-detail-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px 0;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

.back-section {
  margin-bottom: 20px;
}

.job-card {
  margin-bottom: 30px;
}

.job-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 30px;
}

.job-title-section h1 {
  margin: 0 0 15px 0;
  font-size: 28px;
  color: #303133;
}

.job-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.job-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.job-content {
  padding: 0 20px;
}

.info-section,
.description-section,
.requirements-section,
.tags-section,
.company-section,
.map-section {
  margin-bottom: 30px;
}

.info-section h3,
.description-section h3,
.requirements-section h3,
.tags-section h3,
.company-section h3,
.map-section h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  color: #303133;
  border-left: 4px solid #409EFF;
  padding-left: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  gap: 10px;
}

.label {
  color: #606266;
  min-width: 80px;
}

.value {
  color: #303133;
  font-weight: 500;
}

.description-content {
  line-height: 1.6;
  color: #606266;
}

.requirements-list {
  margin: 0;
  padding-left: 20px;
}

.requirements-list li {
  margin-bottom: 8px;
  color: #606266;
}

.tags-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-item {
  margin-bottom: 5px;
}

.company-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.company-details h4 {
  margin: 0 0 5px 0;
  font-size: 18px;
}

.company-industry,
.company-size {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.company-description {
  color: #606266;
  line-height: 1.6;
}

.map-placeholder {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
}

@media (max-width: 768px) {
  .job-header {
    flex-direction: column;
    gap: 20px;
  }
  
  .job-actions {
    width: 100%;
    justify-content: center;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>